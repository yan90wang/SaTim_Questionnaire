import type { MetaField } from "../editor/MetaDataPage.tsx";

export const initialFormSchema: MetaField[] = [
    {
        key: "title",
        label: "Titel",
        type: "text",
        placeholder: "Aufgaben Titel",
        value: "",
        required: true,
    },
    {
        key: "author",
        label: "Autor:in",
        type: "text",
        placeholder: "Name hier eingeben",
        value: "",
    },
    {
        key: "series",
        label: "Aufgaben-Serie",
        type: "text",
        value: "",
    },
    {
        key: "taskId",
        label: "Aufgaben-ID",
        type: "text",
        value: "",
    },
    {
        key: "version",
        label: "Versionsnummer",
        type: "text",
        value: "",
    },

    {
        key: "competencies",
        label: "Liste der getesteten Kompetenzen (Semikolon getrennt)",
        type: "textarea",
        value: "",
    },

    {
        key: "mathProcesses",
        label: "Mathematikbezogene kognitive Prozesse",
        type: "checkbox",
        options: [
            "Wissen, Erkennen und Beschreiben",
            "Operieren und Berechnen",
            "Darstellen und Formalisieren",
            "Erforschen und Explorieren",
            "Mathematisieren und Modellieren",
            "Argumentieren und Begründen",
            "Instrumente und Werkzeuge verwenden",
            "Interpretieren und Reflektieren von Resultaten",
        ],
        optionsValue: {},
    },

    {
        key: "competenceLevel",
        label: "Kompetenzstufe aus Lehrplan 21",
        type: "text",
        value: "",
    },

    {
        key: "competenceLevelOptions",
        label: "Kompetenzniveau",
        type: "checkbox",
        options: [
            "Kompetenzniveau I (Jahrgangsstufe 8)",
            "Kompetenzniveau II (Jahrgangsstufe 8)",
            "Kompetenzniveau III (Jahrgangsstufe 8)",
            "Kompetenzniveau IV (Jahrgangsstufe 8)",
        ],
        optionsValue: {},
    },

    {
        key: "didacticAnalysis",
        label: "Fachdidaktische Analyse Inhaltsbezogene Subdimensionen",
        type: "checkbox",
        options: [
            "Funktionales Verständnis / Grundlagen",
            "Steigung",
            "y-Achsenabschnitt",
            "Nullstellen",
            "Schnittpunkte",
            "Parallelität und Orthogonalität",
            "Darstellungswechsel",
            "Lineares Wachstum / Modellierung",
        ],
        optionsValue: {},
    },

    {
        key: "addressedConcepts",
        label: "Liste adressierter Grundvorstellungen (Semikolon getrennt)",
        type: "textarea",
        value: "",
    },

    {
        key: "taskRepresentations",
        label: "Darstellungen in der Aufgabenstellung",
        type: "checkbox",
        options: [
            "Sachsituation / Realkontext / kontextualisierte Verbalbeschreibung",
            "Innermathematische Verbalbeschreibung",
            "Wertetabelle",
            "Koordinatensystem / Funktionsgraph",
            "Funktionsterm / Funktionsgleichung",
            "Arithmetisches Register",
        ],
        optionsValue: {},
    },

    {
        key: "solutionRepresentations",
        label: "Darstellungen bei der Aufgabenbearbeitung",
        type: "checkbox",
        options: [
            "Sachsituation / Realkontext / kontextualisierte Verbalbeschreibung",
            "Innermathematische Verbalbeschreibung",
            "Wertetabelle",
            "Koordinatensystem / Funktionsgraph",
            "Funktionsterm / Funktionsgleichung",
            "Arithmetisches Register",
        ],
        optionsValue: {},
    },
    {
        key: "answerFormat",
        label: "Antwortformat",
        type: "select",
        options: [
            "Geschlossen",
            "Offene Formel- / Zahleingabe",
            "Offene Texteingabe",
            "Offene Zeichnung / Konstruktion"
        ],
        value: "",
    },
    {
        key: "expectedTime",
        label: "Erwartete mittlere Bearbeitungszeit (Minuten)",
        type: "text",
        value: "",
    },
    {
        key: "additionalNotes",
        label: "Zusätzliche Hinweise oder Kommentare",
        type: "textarea",
        value: "",
    },
    {
        key: "sourceTask",
        label: "Quelle(n) Aufgabenidee (Autor, Jahr, Titel, Zeitschriftentitel, URL)",
        type: "textarea",
        value: "",
    },
    {
        key: "sourceImage",
        label: "Quelle Bild(er) (Angabe oder Link zum Originalbild)",
        type: "textarea",
        value: "",
    },

    {
        key: "gradeLevels",
        label: "Nicht geeignet für Jahrgangsstufe",
        type: "checkbox",
        options: ["7", "8", "9", "10", "11", "12"],
        optionsValue: {},
    },
    {
        key: "gradeLevelsFreeText",
        label: "Mittelschweres Item für",
        type: "select",
        options: [
            "JG 07",
            "JG 08",
            "JG 09",
            "JG 10",
            "JG 11",
            "JG 12"
        ],
        value: "",
    },

];
