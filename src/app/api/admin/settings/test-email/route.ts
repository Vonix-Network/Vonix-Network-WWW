import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { testEmailConfig } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Test email configuration
    const success = await testEmailConfig(email);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Test email sent to ${email}` 
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send test email. Check your SMTP configuration.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error testing email:', error);
    return NextResponse.json({ 
      error: 'Failed to send test email' 
    }, { status: 500 });
  }
}
