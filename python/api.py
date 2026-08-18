from flask import Flask, request, jsonify
import numpy as np

from assessment import halfsplit_question, bayesian_update
app = Flask(__name__)

@app.get("/health")
def health():
    return jsonify({"status": "ok"})

@app.post("/halfsplit")
def halfsplit():
    data = request.get_json()

    probs = np.asarray(data["probs"], dtype=np.float64)
    ks = np.asarray(data["ks"], dtype=np.int8)

    rng = np.random.default_rng()

    item = halfsplit_question(
        probs=probs,
        ks=ks,
        rng=rng,
    )

    return jsonify({
        "item": item,
    })


@app.post("/bayesian-update")
def bayesian_update_endpoint():
    data = request.get_json()

    probs = np.asarray(data["probs"], dtype=np.float64)
    ks = np.asarray(data["ks"], dtype=np.int8)

    beta = data["beta"]
    eta = data["eta"]

    item = int(data["item"])
    response = int(data["response"])

    posterior = bayesian_update(
        probs=probs,
        ks=ks,
        beta=beta,
        eta=eta,
        item=item,
        response=response,
    )

    return jsonify({
        "probs": posterior.tolist(),
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8001,
    )