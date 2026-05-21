import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, code: string) {
    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "SmartEdu <noreply@smartedu.dev>",
        to: email,
        subject: "Mã xác thực đặt lại mật khẩu – SmartEdu",
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
        <tr>
          <td style="background:#1b61c9;padding:32px 40px">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-.3px">SmartEdu</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#181d26">Đặt lại mật khẩu</h2>
            <p style="margin:0 0 28px;color:rgba(4,14,32,.55);font-size:14px;line-height:1.6">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.<br/>
              Sử dụng mã bên dưới để tiếp tục. Mã có hiệu lực trong <strong>10 phút</strong>.
            </p>
            <div style="text-align:center;margin:0 0 28px">
              <div style="display:inline-block;background:#f0f4fb;border:1px solid #d0dff7;border-radius:12px;padding:20px 40px">
                <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1b61c9">${code}</span>
              </div>
            </div>
            <p style="margin:0;color:rgba(4,14,32,.4);font-size:12px;line-height:1.6">
              Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.<br/>
              Mật khẩu của bạn sẽ <strong>không thay đổi</strong>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f2f5">
            <p style="margin:0;color:rgba(4,14,32,.35);font-size:11px;text-align:center">
              © ${new Date().getFullYear()} SmartEdu. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
}
