"""
Brevo Transactional Email client and shared HTML template helpers.
All email modules import send_email + helpers from here.
"""
import sys
from datetime import datetime

from django.conf import settings


# ── Brevo API sender ──────────────────────────────────────────────────────────

def send_email(to_email: str, to_name: str, subject: str, html_content: str,
               reply_to_email: str = None) -> None:
    """
    Send a transactional email via Brevo API (brevo-python v4 SDK).
    Falls back to console print when BREVO_API_KEY is not set (dev/test).
    Raises on API errors.
    """
    api_key = getattr(settings, "BREVO_API_KEY", "")
    if not api_key:
        print(
            f"\n{'='*60}\n[BREVO EMAIL — no API key set]\n"
            f"To:      {to_name} <{to_email}>\n"
            f"Subject: {subject}\n"
            f"{'='*60}\n",
            file=sys.stdout,
        )
        return

    import brevo

    client = brevo.Brevo(api_key=api_key)

    kwargs = dict(
        to=[brevo.SendTransacEmailRequestToItem(email=to_email, name=to_name)],
        sender=brevo.SendTransacEmailRequestSender(
            name="YRIF Mails",
            email=settings.DEFAULT_FROM_EMAIL,
        ),
        subject=subject,
        html_content=html_content,
    )
    if reply_to_email:
        kwargs["reply_to"] = brevo.SendTransacEmailRequestReplyTo(
            email=reply_to_email
        )

    client.transactional_emails.send_transac_email(**kwargs)


# ── HTML Template Helpers ─────────────────────────────────────────────────────

_YEAR = datetime.now().year


def _wrap(content: str) -> str:
    """Full YRIF-branded email shell. Table-based, email-client safe."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>YRIF</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Inter',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;border-radius:14px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(9,51,68,0.10);">

          <!-- ── Header ── -->
          <tr>
            <td bgcolor="#093344" align="center"
                style="padding:36px 40px 32px;border-radius:14px 14px 0 0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center"
                      style="border-bottom:3px solid #0D9488;padding-bottom:10px;">
                    <span style="color:#ffffff;font-size:30px;font-weight:800;
                                 letter-spacing:-0.5px;font-family:'Inter',Arial,sans-serif;">
                      YRIF
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:10px;">
                    <span style="color:rgba(255,255,255,0.65);font-size:12px;
                                 letter-spacing:0.06em;text-transform:uppercase;">
                      Youth Research &amp; Innovation Foundation
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td bgcolor="#ffffff"
                style="padding:40px;border-left:1px solid #e2e8f0;
                       border-right:1px solid #e2e8f0;">
              {content}
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td bgcolor="#093344" align="center"
                style="padding:24px 40px;border-radius:0 0 14px 14px;">
              <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0 0 6px;">
                &copy; {_YEAR} Youth Research &amp; Innovation Foundation &middot; Tanzania
              </p>
              <p style="margin:0;">
                <a href="mailto:info@yriftz.org"
                   style="color:rgba(255,255,255,0.6);font-size:12px;text-decoration:none;">
                  info@yriftz.org
                </a>
                &nbsp;&middot;&nbsp;
                <a href="https://yriftz.org"
                   style="color:rgba(255,255,255,0.6);font-size:12px;text-decoration:none;">
                  yriftz.org
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _cta(url: str, label: str, color: str = "#0D9488") -> str:
    """Teal (or custom) CTA button, centered."""
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding:28px 0 8px;">
      <a href="{url}"
         style="background-color:{color};color:#ffffff;text-decoration:none;
                padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;
                display:inline-block;letter-spacing:0.02em;
                font-family:'Inter',Arial,sans-serif;">
        {label}
      </a>
    </td>
  </tr>
</table>"""


def _otp_box(code: str, expiry: str = "15 minutes") -> str:
    """Large OTP verification code box."""
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding:8px 0 28px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center"
              style="background-color:#f0fdfa;border:2px solid #0D9488;
                     border-radius:12px;padding:28px 56px;">
            <p style="color:#6B7280;font-size:11px;text-transform:uppercase;
                      letter-spacing:0.12em;margin:0 0 12px;">
              Verification Code
            </p>
            <p style="color:#093344;font-size:46px;font-weight:800;
                      letter-spacing:0.22em;margin:0;
                      font-family:'Courier New',Courier,monospace;">
              {code}
            </p>
            <p style="color:#9CA3AF;font-size:12px;margin:12px 0 0;">
              Expires in {expiry} &middot; Do not share this code
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>"""


def _info_card(*rows) -> str:
    """
    Info card with label-value rows.
    Each row is a (label, value) tuple.
    """
    row_html = "".join(
        f'<p style="margin:0 0 {("0" if i == len(rows)-1 else "10")}px;'
        f'font-size:14px;color:#374151;line-height:1.5;">'
        f'<strong style="color:#111827;">{label}:</strong> {value}</p>'
        for i, (label, value) in enumerate(rows)
    )
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:#f8fafc;border-radius:10px;margin:0 0 24px;">
  <tr>
    <td style="padding:20px 24px;">
      {row_html}
    </td>
  </tr>
</table>"""


def _status_badge(label: str, bg: str, text_color: str = "#ffffff") -> str:
    return (
        f'<span style="background-color:{bg};color:{text_color};'
        f'padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;'
        f'display:inline-block;letter-spacing:0.04em;">{label}</span>'
    )


def _divider() -> str:
    return '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">'


def _h2(text: str, color: str = "#093344") -> str:
    return (
        f'<h2 style="color:{color};font-size:22px;font-weight:700;'
        f'margin:0 0 16px;font-family:\'Inter\',Arial,sans-serif;">{text}</h2>'
    )


def _p(text: str, color: str = "#4B5563", size: str = "15px") -> str:
    return (
        f'<p style="color:{color};font-size:{size};line-height:1.7;'
        f'margin:0 0 16px;">{text}</p>'
    )


def _small(text: str) -> str:
    return f'<p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:16px 0 0;">{text}</p>'


def _alert_block(text: str, border_color: str = "#ef4444",
                 bg_color: str = "#fef2f2", text_color: str = "#dc2626") -> str:
    return (
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0"'
        f' style="background-color:{bg_color};border-left:4px solid {border_color};'
        f'border-radius:6px;margin:16px 0;">'
        f'<tr><td style="padding:14px 16px;">'
        f'<p style="color:{text_color};font-size:14px;margin:0;line-height:1.6;">{text}</p>'
        f'</td></tr></table>'
    )


def _feature_list(*items) -> str:
    rows = "".join(
        f'<tr>'
        f'<td width="20" valign="top" style="padding:0 10px 10px 0;">'
        f'<span style="color:#0D9488;font-size:16px;">&#10003;</span></td>'
        f'<td style="padding:0 0 10px;font-size:14px;color:#4B5563;line-height:1.6;">{item}</td>'
        f'</tr>'
        for item in items
    )
    return (
        f'<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">'
        f'{rows}</table>'
    )
