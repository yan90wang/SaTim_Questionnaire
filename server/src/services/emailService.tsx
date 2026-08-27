import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

interface Under14EmailInput {
    teacherEmail: string;
    teacherFirstName: string;
    teacherLastName: string;
    className: string;
}

export const sendUnder14RegistrationEmail = async ({
                                                       teacherEmail,
                                                       teacherFirstName,
                                                       teacherLastName,
                                                       className,
                                                   }: Under14EmailInput) => {

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: ["peter.steiner@phsg.ch", teacherEmail],
        subject: "Registrierung eines Schülers unter 14 Jahren",
        text: `
Guten Tag ${teacherFirstName} ${teacherLastName},

ein Schüler aus deiner Klasse "${className}" hat versucht,
sich über den Klassen-Registrierungslink zu registrieren.

Da der Schüler unter 14 Jahre alt ist, kann die Registrierung
nicht selbstständig abgeschlossen werden.

Bitte erstelle das Schülerkonto über das Lehrer-Portal und
stelle dem Schüler anschließend die Zugangsdaten zur Verfügung.

Der Schüler wurde darüber informiert, dass er dich kontaktieren soll.

Freundliche Grüsse
PHSG - SaTiM
        `,
    });
};