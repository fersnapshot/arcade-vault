import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, msg } = await req.json();

  if (!name?.trim() || !email?.trim() || !msg?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Todos los campos son requeridos." },
      { status: 400 }
    );
  }

  const { error } = await resend.emails.send({
    from: "Arcade Vault <onboarding@resend.dev>",
    to: process.env.EMAIL_ADDRESS!,
    subject: `Nuevo mensaje de ${name}`,
    text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${msg}`,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
