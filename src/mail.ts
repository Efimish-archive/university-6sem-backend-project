import { createTransport } from "nodemailer";

export const transporter = createTransport({
  host: "127.0.0.1",
  port: 1025,
});

const from = "Автомойка <noreply@wash.cars>";
const to = "user@example.com";
const subject = "Проверка Mailpit + Nodemailer";
const text = "Привет! Это текстовое сообщение.";

transporter.sendMail({
  from,
  to,
  subject,
  text,
});
