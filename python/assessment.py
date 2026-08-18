"""Adaptive knowledge-space-theory (KST) assessment — pure functions.

This module is a translation of the assessment routines in the R package
``kstMatrix`` (GPL-3, Hockemeyer et al.). Each function below cites the
exact source file and line range it ports.

Public API
----------

* :func:`halfsplit_question` — pick the next item to ask, given the
  current belief distribution over knowledge states.
* :func:`bayesian_update` — Bayes-update the belief after observing a
  student's response.
* :func:`simplified_assessment` — the full ``kmsassess`` loop, exposed
  for batch/simulation use.

All functions are pure. Knowledge structures and probability vectors
are NumPy arrays. Randomness for tie-breaking is supplied through an
injected :class:`numpy.random.Generator`.

Item indexing
-------------

The public API uses **1-based item numbers** to match ``kstMatrix``'s
output (so a ``queried`` sequence ``[4, 2, 3, 5]`` aligns with the R
reference). Internally the code is 0-based.
"""

from __future__ import annotations

import time
import warnings
from dataclasses import dataclass
from typing import Callable, Sequence

import numpy as np

__all__ = [
    "AssessmentResult",
    "bayesian_update",
    "halfsplit_question",
    "simplified_assessment",
]


# ---------------------------------------------------------------------------
# Public dataclass
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class AssessmentResult:
    """The output of a completed adaptive assessment.

    Mirrors R's ``kmassess`` return value, which is a list with elements
    ``state``, ``probs``, ``queried``, ``qtime``, ``utime``.

    Attributes
    ----------
    state
        Binary tuple of length ``n`` (one entry per item). ``1`` means
        the diagnosed student state contains that item. When multiple
        states tie for maximum probability, R's ``which(probs == max)``
        returns several rows; this tuple is then those rows flattened in
        row order (mirroring R).
    probs
        Either the *final* probability distribution over states (length
        ``N``) when ``probdev=False``, or a list of length
        ``len(queried) + 1`` containing the distribution after each
        observation (starting with the uniform prior) when
        ``probdev=True``.
    queried
        1-based item numbers, in the order they were asked.
    qtime
        Average wall-clock time (seconds) spent selecting a question,
        mirroring R's ``qtime``. Nondeterministic; present for API parity.
    utime
        Average wall-clock time (seconds) spent updating probabilities,
        mirroring R's ``utime``. Nondeterministic; present for API parity.
    """

    state: tuple[int, ...]
    probs: np.ndarray | list[np.ndarray]
    queried: tuple[int, ...]
    qtime: float
    utime: float


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


# R's kmdoubleequal default tolerance is sqrt(.Machine$double.eps).
# We mirror it exactly so assertions agree across the two implementations.
_R_FLOAT_TOL = float(np.sqrt(np.finfo(np.float64).eps))


def _validate_ks(ks: np.ndarray) -> None:
    if ks.ndim != 2:
        raise ValueError("ks must be a 2D matrix (states × items).")
    if ks.size == 0:
        raise ValueError("ks must contain at least one state and one item.")
    if not np.array_equal(ks, ks.astype(bool).astype(ks.dtype)):
        raise ValueError("ks must be a binary matrix (entries in {0, 1}).")


def _validate_probs(probs: np.ndarray, expected_len: int) -> None:
    if probs.ndim != 1:
        raise ValueError("probs must be a 1D vector.")
    if probs.shape[0] != expected_len:
        raise ValueError(
            f"probs length {probs.shape[0]} != number of states {expected_len}."
        )
    if probs.min() < 0 or probs.max() > 1:
        raise ValueError("probs entries must lie in [0, 1].")
    if abs(probs.sum() - 1.0) >= _R_FLOAT_TOL:
        raise ValueError(f"probs must sum to 1 (got {probs.sum()}).")


def _broadcast_per_item(value: float | Sequence[float] | np.ndarray, n: int) -> np.ndarray:
    """Accept a scalar or a length-n array, return a length-n float64 vector."""
    arr = np.asarray(value, dtype=np.float64)
    if arr.ndim == 0:
        return np.full(n, float(arr))
    if arr.shape != (n,):
        raise ValueError(f"expected scalar or length-{n} vector, got shape {arr.shape}.")
    return arr


# ---------------------------------------------------------------------------
# halfsplit — translates kstMatrix/R/kmassesshalfsplit.R
# ---------------------------------------------------------------------------


def halfsplit_question(
    probs: np.ndarray,
    ks: np.ndarray,
    rng: np.random.Generator,
) -> int:
    """Pick the next item to ask under the half-split rule.

    Ports ``kmassesshalfsplit.R`` lines 17–43.

    The half-split rule chooses the item whose probability of mastery
    under the current belief is closest to 0.5 — i.e. the item that
    splits the belief mass most evenly when answered. Ties are broken
    uniformly at random.

    Parameters
    ----------
    probs
        Length-``N`` probability distribution over states.
    ks
        ``N × n`` binary matrix encoding the knowledge structure.
    rng
        NumPy random generator used for tie-breaking. Tests should pin
        this to a deterministic seed.

    Returns
    -------
    int
        The 1-based item number to ask next.
    """
    _validate_ks(ks)
    _validate_probs(probs, expected_len=ks.shape[0])

    # ip[q] = sum_s probs[s] * 1[s contains q]
    item_prob = probs @ ks.astype(np.float64)  # shape (n,)
    distance = np.abs(item_prob - 0.5)
    min_dist = distance.min()
    candidates = np.flatnonzero(distance == min_dist)
    if candidates.size == 1:
        return int(candidates[0]) + 1
    return int(rng.choice(candidates)) + 1


# ---------------------------------------------------------------------------
# bayesian update — translates kstMatrix/R/kmassessbayesian.R
# ---------------------------------------------------------------------------


def bayesian_update(
    probs: np.ndarray,
    ks: np.ndarray,
    beta: float | Sequence[float] | np.ndarray,
    eta: float | Sequence[float] | np.ndarray,
    item: int,
    response: int,
) -> np.ndarray:
    """Return the posterior over states after observing a response.

    Ports ``kmassessbayesian.R`` lines 26–67.

    For each state ``s``, the likelihood of the observation is:

    * If ``s`` contains the asked item:
        - response correct → ``1 − β_item``
        - response wrong   → ``β_item``  (careless error)
    * If ``s`` does not contain the asked item:
        - response correct → ``η_item``  (lucky guess)
        - response wrong   → ``1 − η_item``

    Parameters
    ----------
    probs
        Prior probability distribution over states (length ``N``).
    ks
        ``N × n`` binary knowledge structure.
    beta, eta
        BLIM parameters. Either a scalar (applied to all items, matching
        ``kmsassess``) or a length-``n`` vector (matching ``kmassess``).
    item
        1-based item number that was asked.
    response
        ``1`` for correct, ``0`` for wrong.

    Returns
    -------
    numpy.ndarray
        New length-``N`` probability vector. ``probs`` is not mutated.
    """
    _validate_ks(ks)
    n = ks.shape[1]
    _validate_probs(probs, expected_len=ks.shape[0])

    beta_v = _broadcast_per_item(beta, n)
    eta_v = _broadcast_per_item(eta, n)
    if beta_v.min() < 0 or beta_v.max() > 1:
        raise ValueError("beta entries must lie in [0, 1].")
    if eta_v.min() < 0 or eta_v.max() > 1:
        raise ValueError("eta entries must lie in [0, 1].")
    if np.any(beta_v + eta_v > 1):
        warnings.warn(
            "beta_q + eta_q should be less than 1 for all items q.",
            UserWarning,
            stacklevel=2,
        )
    if response not in (0, 1):
        raise ValueError("response must be 0 or 1.")
    if not 1 <= item <= n:
        raise ValueError(f"item must be in [1, {n}].")

    q = item - 1
    if response == 1:
        up, um = 1.0 - beta_v[q], eta_v[q]
    else:
        up, um = beta_v[q], 1.0 - eta_v[q]

    contains_q = ks[:, q].astype(bool)
    likelihood = np.where(contains_q, up, um)
    posterior = likelihood * probs

    total = posterior.sum()
    if total == 0.0:
        # Pathological: the response was impossible under every state.
        # Falling back to the prior keeps the loop alive.
        return probs.copy()
    return posterior / total


# ---------------------------------------------------------------------------
# simplified_assessment — translates kstMatrix/R/kmsassess.R + kmassess.R
# ---------------------------------------------------------------------------


def simplified_assessment(
    responses: np.ndarray,
    ks: np.ndarray,
    *,
    beta: float = 0.1,
    eta: float = 0.1,
    threshold: float = 0.51,
    rng: np.random.Generator | None = None,
    prior: np.ndarray | None = None,
    probdev: bool = False,
) -> AssessmentResult | None:
    """Run the full half-split + Bayesian adaptive assessment loop.

    Ports the iteration in ``kmassess.R`` lines 144–259 with the
    ``kmsassess`` defaults (scalar β/η, uniform prior).

    Parameters
    ----------
    responses
        Length-``n`` binary vector. The student's answer to item ``i``
        (1-based: ``responses[i - 1]``) is consulted when the loop
        picks item ``i``. This signature matches ``kmsassess(r=...)`` —
        ``r`` is a full response pattern; the loop only consults the
        entries for items it ends up asking.
    ks
        ``N × n`` binary knowledge structure.
    beta, eta
        Scalar BLIM probabilities, applied uniformly.
    threshold
        Stopping criterion: loop terminates once ``max(probs) >
        threshold``.
    rng
        NumPy generator for halfsplit tie-breaking. Defaults to a fresh
        ``np.random.default_rng()`` if not provided.
    prior
        Optional length-``N`` initial distribution. Defaults to uniform
        ``1/N`` (matching R).
    probdev
        If ``True``, return the full sequence of probability vectors
        (one per iteration plus the prior) in ``result.probs`` instead
        of just the final one.

    Returns
    -------
    AssessmentResult
    """
    _validate_ks(ks)
    if responses.shape != (ks.shape[1],):
        raise ValueError(
            f"responses must have length {ks.shape[1]}, got {responses.shape}."
        )
    if not np.array_equal(responses, responses.astype(bool).astype(responses.dtype)):
        raise ValueError("responses must be a binary vector.")
    if threshold < 0 or threshold > 1:
        raise ValueError("Threshokd must be between 0 and 1.")
    if threshold <= 0.5:
        warnings.warn("Threshold shoud be larger than 0.5!", UserWarning, stacklevel=2)

    n_states, n_items = ks.shape
    if prior is None:
        probs = np.full(n_states, 1.0 / n_states, dtype=np.float64)
    else:
        probs = np.asarray(prior, dtype=np.float64).copy()
        _validate_probs(probs, expected_len=n_states)

    rng = rng if rng is not None else np.random.default_rng()

    queried: list[int] = []
    problist: list[np.ndarray] = [probs.copy()]
    qtimes: list[float] = []
    utimes: list[float] = []

    while probs.max() <= threshold:
        t0 = time.perf_counter()
        item = halfsplit_question(probs, ks, rng)
        qtimes.append(time.perf_counter() - t0)
        queried.append(item)
        # R appends the question, then checks the guard (kmassess.R:223-229).
        if len(queried) > 2 * n_items:
            warnings.warn(
                "Reached twice of number of items as number of questions!",
                UserWarning,
                stacklevel=2,
            )
            warnings.warn(
                f"Question sequence: {', '.join(str(q) for q in queried)}",
                UserWarning,
                stacklevel=2,
            )
            return None
        response = int(responses[item - 1])
        t1 = time.perf_counter()
        probs = bayesian_update(probs, ks, beta, eta, item, response)
        utimes.append(time.perf_counter() - t1)
        problist.append(probs.copy())

    # R: which(probs == max(probs)) — may be multiple indices; state is the
    # ks rows at those indices. R's as.integer(ks[winners, ]) flattens a
    # matrix column-major, so we mirror that with order="F".
    max_val = probs.max()
    winners = np.flatnonzero(probs == max_val)
    if winners.size == 1:
        state = tuple(int(x) for x in ks[winners[0]])
    else:
        state = tuple(int(x) for x in ks[winners].reshape(-1, order="F"))

    return AssessmentResult(
        state=state,
        probs=problist if probdev else probs,
        queried=tuple(queried),
        qtime=(sum(qtimes) / len(qtimes)) if qtimes else 0.0,
        utime=(sum(utimes) / len(utimes)) if utimes else 0.0,
    )


# ---------------------------------------------------------------------------
# Convenience: closure-style interactive loop
# ---------------------------------------------------------------------------


def interactive_assessment(
    ks: np.ndarray,
    respond: Callable[[int], int],
    *,
    beta: float = 0.1,
    eta: float = 0.1,
    threshold: float = 0.51,
    rng: np.random.Generator | None = None,
    prior: np.ndarray | None = None,
) -> AssessmentResult | None:
    """Run the adaptive loop, calling ``respond(item)`` for each question.

    Mirrors ``simplified_assessment`` but takes a callable that produces
    a 0/1 answer on demand, rather than a pre-recorded response vector.
    Useful for batch-mode integration tests where the student model is
    a function. Production use cases drive the primitives
    (``halfsplit_question`` + ``bayesian_update``) directly from a web
    request loop.

    Returns ``None`` if the runaway guard trips (``2 * n`` questions without
    crossing the threshold), mirroring R's ``kmassess``.
    """
    _validate_ks(ks)
    n_states, n_items = ks.shape
    probs = (
        np.full(n_states, 1.0 / n_states, dtype=np.float64)
        if prior is None
        else np.asarray(prior, dtype=np.float64).copy()
    )
    _validate_probs(probs, expected_len=n_states)
    rng = rng if rng is not None else np.random.default_rng()

    queried: list[int] = []
    problist: list[np.ndarray] = [probs.copy()]
    qtimes: list[float] = []
    utimes: list[float] = []

    while probs.max() <= threshold:
        t0 = time.perf_counter()
        item = halfsplit_question(probs, ks, rng)
        qtimes.append(time.perf_counter() - t0)
        response = respond(item)
        if response not in (0, 1):
            raise ValueError(f"respond({item}) must return 0 or 1, got {response!r}.")
        queried.append(item)
        if len(queried) > 2 * n_items:
            warnings.warn(
                "Reached twice of number of items as number of questions!",
                UserWarning,
                stacklevel=2,
            )
            warnings.warn(
                f"Question sequence: {', '.join(str(q) for q in queried)}",
                UserWarning,
                stacklevel=2,
            )
            return None
        t1 = time.perf_counter()
        probs = bayesian_update(probs, ks, beta, eta, item, response)
        utimes.append(time.perf_counter() - t1)
        problist.append(probs.copy())

    max_val = probs.max()
    winners = np.flatnonzero(probs == max_val)
    if winners.size == 1:
        state = tuple(int(x) for x in ks[winners[0]])
    else:
        state = tuple(int(x) for x in ks[winners].reshape(-1, order="F"))
    return AssessmentResult(
        state=state,
        probs=probs,
        queried=tuple(queried),
        qtime=(sum(qtimes) / len(qtimes)) if qtimes else 0.0,
        utime=(sum(utimes) / len(utimes)) if utimes else 0.0,
    )
