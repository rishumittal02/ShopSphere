import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    FRONTEND_URL,
)

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_content: str, text_content: str = "") -> bool:
    """
    Sends an email using configured SMTP settings.
    Falls back gracefully to logging in development / testing environments.
    """
    if not text_content:
        text_content = subject

    # If SMTP is configured, attempt real delivery
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject

            # Gmail strictly requires the sender to match SMTP_USER or an authorized alias
            effective_from = SMTP_USER if (
                "gmail.com" in (SMTP_HOST or "").lower()
                or not SMTP_FROM_EMAIL
                or "@shopsphere.in" in SMTP_FROM_EMAIL
            ) else SMTP_FROM_EMAIL

            msg["From"] = f"{SMTP_FROM_NAME} <{effective_from}>"
            msg["To"] = to_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            if SMTP_PORT == 465:
                with smtplib.SMTP_SSL(SMTP_HOST, 465, timeout=8) as server:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.sendmail(effective_from, [to_email], msg.as_string())
            else:
                try:
                    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=8) as server:
                        server.starttls()
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.sendmail(effective_from, [to_email], msg.as_string())
                except Exception as tls_err:
                    logger.warning(f"SMTP STARTTLS on port {SMTP_PORT} failed ({tls_err}). Falling back to port 465 SSL...")
                    print(f"[SHOPSPHERE SMTP] Port {SMTP_PORT} failed ({tls_err}), falling back to 465 SSL...")
                    with smtplib.SMTP_SSL(SMTP_HOST, 465, timeout=8) as server:
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.sendmail(effective_from, [to_email], msg.as_string())

            logger.info(f"Successfully dispatched real email to {to_email}: {subject}")
            print(f"[SHOPSPHERE EMAIL SENT] Dispatched to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.warning(f"SMTP delivery failed to {to_email} ({e}). Logging email instead.")
            print(f"[SHOPSPHERE SMTP ERROR] Failed sending to {to_email}: {e}")

    # Development / Fallback simulated email log
    logger.info("=" * 60)
    logger.info(f"[SHOPSPHERE EMAIL SIMULATION - SMTP NOT CONFIGURED]")
    logger.info(f"To: {to_email}")
    logger.info(f"From: {SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>")
    logger.info(f"Subject: {subject}")
    logger.info(f"Text Preview: {text_content[:200]}...")
    logger.info("=" * 60)

    print("\n" + "=" * 60)
    print(f"[SHOPSPHERE EMAIL SIMULATION - NO SMTP IN .env]")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Text Content: {text_content}")
    print("=" * 60 + "\n")
    return True


def send_order_confirmation_email(order, user) -> bool:
    """Dispatches order confirmation receipt to the buyer."""
    subject = f"Order Confirmed #{order.id} - ShopSphere"
    
    items_html = ""
    for item in order.items:
        product_name = getattr(item.product, "name", "Product") if hasattr(item, "product") else "Product"
        item_price = f"Rs. {float(item.price):,.2f}"
        item_total = f"Rs. {(float(item.price) * item.quantity):,.2f}"
        items_html += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 8px; font-weight: 600; color: #1e293b;">{product_name}</td>
            <td style="padding: 12px 8px; text-align: center; color: #64748b;">{item.quantity}</td>
            <td style="padding: 12px 8px; text-align: right; color: #64748b;">{item_price}</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #0f172a;">{item_total}</td>
        </tr>
        """

    total_str = f"Rs. {float(order.total_amount):,.2f}"
    orders_url = f"{FRONTEND_URL}/orders"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 32px 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">ShopSphere</h1>
                <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9;">Order #{order.id} Confirmation</p>
            </div>
            
            <div style="padding: 32px 24px;">
                <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">Thank you for your order, {user.name}!</h2>
                <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.5;">
                    Your payment has been successfully authorized via <strong>{order.payment_method or 'Razorpay'}</strong>. We are preparing your package for express dispatch.
                </p>

                <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <table style="width: 100%; font-size: 13px;">
                        <tr>
                            <td style="color: #64748b;">Order Number:</td>
                            <td style="text-align: right; font-weight: 700; color: #0f172a;">#{order.id}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b;">Status:</td>
                            <td style="text-align: right; font-weight: 700; color: #16a34a;">CONFIRMED</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b;">Payment Method:</td>
                            <td style="text-align: right; font-weight: 600; color: #0f172a;">{order.payment_method or 'Razorpay'}</td>
                        </tr>
                    </table>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">
                            <th style="padding: 8px;">Item</th>
                            <th style="padding: 8px; text-align: center;">Qty</th>
                            <th style="padding: 8px; text-align: right;">Price</th>
                            <th style="padding: 8px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 16px 8px; font-weight: 700; font-size: 16px; text-align: right; color: #0f172a;">Grand Total:</td>
                            <td style="padding: 16px 8px; font-weight: 900; font-size: 18px; text-align: right; color: #2563eb;">{total_str}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="text-align: center; margin-top: 32px;">
                    <a href="{orders_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">View Order on ShopSphere</a>
                </div>
            </div>

            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0;">ShopSphere Technologies Pvt. Ltd. • Bengaluru, India</p>
                <p style="margin: 4px 0 0;">Need assistance? Contact us at support@shopsphere.in</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"Thank you for your order #{order.id} on ShopSphere! Total: {total_str}. View your order: {orders_url}"
    return send_email(user.email, subject, html_content, text_content)


def send_order_cancellation_email(order, user) -> bool:
    """Dispatches order cancellation receipt to the buyer."""
    subject = f"Order #{order.id} Cancelled - ShopSphere"
    orders_url = f"{FRONTEND_URL}/orders"
    total_str = f"Rs. {float(order.total_amount):,.2f}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
            <div style="background: #ef4444; padding: 28px 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 900;">ShopSphere</h1>
                <p style="margin: 6px 0 0; font-size: 15px;">Order #{order.id} Cancelled</p>
            </div>
            
            <div style="padding: 32px 24px;">
                <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">Hello {user.name},</h2>
                <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.5;">
                    Your request to cancel Order <strong>#{order.id}</strong> ({total_str}) has been completed.
                    All reserved items have been restored to inventory. If any payment was captured, the refund will be initiated back to your original source within 3-5 business days.
                </p>

                <div style="text-align: center; margin-top: 24px;">
                    <a href="{orders_url}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block;">Return to My Orders</a>
                </div>
            </div>

            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                ShopSphere Support • care@shopsphere.in
            </div>
        </div>
    </body>
    </html>
    """
    text_content = f"Your Order #{order.id} has been cancelled successfully. View orders: {orders_url}"
    return send_email(user.email, subject, html_content, text_content)


def send_verification_email(user, code: str, user_name: str = "") -> bool:
    """Sends 6-digit registration verification code."""
    to_email = getattr(user, "email", user) if not isinstance(user, str) else user
    name = getattr(user, "name", user_name) if not isinstance(user, str) else (user_name or "Customer")

    subject = f"Verify your ShopSphere Account ({code})"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 28px 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">ShopSphere</h1>
                <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Email Verification</p>
            </div>
            
            <div style="padding: 32px 24px; text-align: center;">
                <h2 style="margin: 0 0 8px; font-size: 20px; color: #0f172a;">Welcome to ShopSphere, {name}!</h2>
                <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.5;">
                    Please enter the following 6-digit verification code to confirm your email address and activate your account:
                </p>

                <div style="background: #f1f5f9; border: 2px dashed #93c5fd; border-radius: 16px; padding: 20px; display: inline-block; margin-bottom: 24px;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8;">{code}</span>
                </div>

                <p style="margin: 0; font-size: 13px; color: #64748b;">
                    ⏱️ This verification code is valid for <strong>15 minutes</strong>.
                </p>
                <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">
                    If you didn&apos;t create an account with ShopSphere, you can safely ignore this email.
                </p>
            </div>

            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                ShopSphere Technologies Pvt. Ltd. • Secure Account Services
            </div>
        </div>
    </body>
    </html>
    """
    text_content = f"Welcome to ShopSphere! Your 6-digit verification code is: {code}. It expires in 15 minutes."
    return send_email(to_email, subject, html_content, text_content)


def send_password_reset_email(user, reset_url: str, user_name: str = "") -> bool:
    """Sends password reset link to user."""
    to_email = getattr(user, "email", user) if not isinstance(user, str) else user
    name = getattr(user, "name", user_name) if not isinstance(user, str) else (user_name or "Customer")

    subject = "Reset Your ShopSphere Password"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">ShopSphere</h1>
                <p style="margin: 6px 0 0; font-size: 14px; color: #94a3b8;">Password Reset Request</p>
            </div>
            
            <div style="padding: 32px 24px; text-align: center;">
                <h2 style="margin: 0 0 12px; font-size: 19px; color: #0f172a;">Hello {name},</h2>
                <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.5;">
                    We received a request to reset the password for your ShopSphere account. Click the button below to choose a new password:
                </p>

                <div style="margin: 24px 0;">
                    <a href="{reset_url}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">Reset My Password</a>
                </div>

                <p style="margin: 16px 0 0; font-size: 12px; color: #64748b;">
                    Or copy and paste this URL into your browser:<br>
                    <a href="{reset_url}" style="color: #2563eb; word-break: break-all; font-size: 11px;">{reset_url}</a>
                </p>

                <p style="margin: 24px 0 0; font-size: 12px; color: #94a3b8;">
                    ⏱️ This reset link expires in <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
                </p>
            </div>

            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                ShopSphere Security Team • care@shopsphere.in
            </div>
        </div>
    </body>
    </html>
    """
    text_content = f"Reset your ShopSphere password by visiting this link: {reset_url} (Expires in 30 minutes)."
    return send_email(to_email, subject, html_content, text_content)
