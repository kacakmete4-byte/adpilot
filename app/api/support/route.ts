import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const subject = String(body.subject || '').trim() || 'Iletisim Formu';
    const message = String(body.message || '').trim();
    const category = String(body.category || 'general').trim().toLowerCase();

    if (!name || !phone || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Ad, telefon, e-posta ve mesaj zorunludur.' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, error: 'Geçerli bir e-posta girin.' }, { status: 400 });
    }

    const safeCategory = ['general', 'complaint', 'billing', 'bug'].includes(category)
      ? category
      : 'general';

    let createdTicketId: string | null = null;

    try {
      const created = await prisma.supportTicket.create({
        data: {
          userId: (session?.user as any)?.id || null,
          name,
          phone,
          email,
          subject,
          message,
          category: safeCategory,
          status: 'open',
          priority: safeCategory === 'complaint' ? 'high' : 'normal',
        },
      });

      createdTicketId = created.id;
    } catch (dbError) {
      console.error('Support ticket DB save failed:', dbError);
    }

    let mailSent = false;

    if (process.env.GMAIL_USER && process.env.GMAIL_PASSWORD && process.env.ADMIN_EMAIL) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: `Advara Destek <${process.env.GMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `[Advara] Yeni Destek Talebi - ${subject}`,
          text: [
            `Ticket ID: ${createdTicketId || 'kaydedilemedi'}`,
            `Kategori: ${safeCategory}`,
            `Ad: ${name}`,
            `Telefon: ${phone}`,
            `E-posta: ${email}`,
            '',
            'Mesaj:',
            message,
          ].join('\n'),
        });

        mailSent = true;
      } catch (mailError) {
        console.error('Support ticket email send failed:', mailError);
      }
    }

    if (!createdTicketId && !mailSent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Talep şu an iletilemedi. Lütfen biraz sonra tekrar deneyin.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticketId: createdTicketId,
      message: 'Talebiniz alındı. En kısa sürede dönüş yapacağız.',
    });
  } catch (error) {
    console.error('Support API error:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu.' }, { status: 500 });
  }
}
