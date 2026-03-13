import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    family: 4,
    tls: {
      rejectUnauthorized: false
    }
  } as any);
}

export async function sendOrderConfirmationEmail(to: string, order: any) {
  try {
    const mailOptions = {
      from: `Villorita <${process.env.GMAIL_USER}>`,
      to,
      subject: `Order Confirmation - Order #${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6b21a8;">Order Confirmed!</h1>
          <p>Hi ${order.shippingAddress.name},</p>
          <p>Thank you for your order. We are preparing it with love!</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
            <p><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toDateString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          </div>

          <h3>Items:</h3>
          <ul>
            ${order.items.map((item: any) => `
              <li>
                <strong>${item.name}</strong> (${item.weight}) x ${item.quantity} - ₹${item.price * item.quantity}
              </li>
            `).join('')}
          </ul>

          <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #c2410c; font-weight: bold;">
              NOTE: Give OTP at the time of delivery
            </p>
            <p style="margin: 5px 0 0 0; font-size: 1.2em; font-weight: bold;">
              Your OTP is: ${order.otp}
            </p>
          </div>

          <p>Shipping Address:<br>
          ${order.shippingAddress.addressLine1},<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
          Phone: ${order.shippingAddress.phone}</p>

          <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
            Villorita Team<br>
            <a href="${process.env.NEXTAUTH_URL}" style="color: #6b21a8;">Visit Website</a>
          </p>
        </div>
      `,
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`📧 Order confirmation email sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send order confirmation email:', error?.message || error);
    return false; // Don't block order creation
  }
}

export async function sendOTP(to: string, otp: string) {
  try {
    const mailOptions = {
      from: `Villorita <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Your Verification OTP - Villorita',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6b21a8; margin: 0;">Villorita</h1>
          </div>
          <h2 style="color: #374151; margin-top: 0;">Verify Your Request</h2>
          <p style="color: #4b5563;">Please use the following OTP to complete your verification:</p>
          
          <div style="background-color: #f3e8ff; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6b21a8;">${otp}</span>
          </div>
          
          <p style="color: #6b7280; font-size: 0.9em;">This OTP is valid for 2 minutes. Do not share this code with anyone.</p>
          
          <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 0.8em; margin: 0;">© ${new Date().getFullYear()} Villorita. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send OTP email. Error:', error?.message || error);
    console.error('   GMAIL_USER set:', !!process.env.GMAIL_USER);
    console.error('   GMAIL_APP_PASSWORD set:', !!process.env.GMAIL_APP_PASSWORD);
    return false;
  }
}

export async function sendVendorOrderNotification(to: string, orderId: string, vendorName: string) {
  try {
    const mailOptions = {
      from: `Villorita <${process.env.GMAIL_USER}>`,
      to,
      subject: `New Order Assigned - Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h1 style="color: #6b21a8;">New Order Assigned!</h1>
          <p>Hi ${vendorName},</p>
          <p>You have got a new order from Villorita! Please check your vendor dashboard to start preparing it.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
          </div>
          <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
            Villorita Team<br>
            <a href="${process.env.NEXTAUTH_URL}/vendor/orders" style="color: #6b21a8;">Go to Dashboard</a>
          </p>
        </div>
      `,
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`📧 Vendor notification email sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send vendor notification email:', error?.message || error);
    return false;
  }
}

export async function sendVendorItemAssignedEmail(to: string, orderId: string, vendorName: string, itemName: string) {
  try {
    const mailOptions = {
      from: `Villorita <${process.env.GMAIL_USER}>`,
      to,
      subject: `New Item Assigned - Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h1 style="color: #6b21a8;">New Assignment!</h1>
          <p>Hi ${vendorName},</p>
          <p>You have been assigned to prepare a specific item for an order from Villorita. Please check your vendor dashboard to start preparing it.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Item Name:</strong> ${itemName}</p>
          </div>
          <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
            Villorita Team<br>
            <a href="${process.env.NEXTAUTH_URL}/vendor/orders" style="color: #6b21a8;">Go to Dashboard</a>
          </p>
        </div>
      `,
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`📧 Vendor item notification email sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send vendor item notification email:', error?.message || error);
    return false;
  }
}

export async function sendDeliveryAgentNotification(to: string[] | string, orderId: string) {
  try {
    // If 'to' is empty, do nothing
    if (!to || (Array.isArray(to) && to.length === 0)) return false;
    
    const mailOptions = {
      from: `Villorita <${process.env.GMAIL_USER}>`,
      to, // Can be an array of agent emails
      subject: `New Delivery Available - Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h1 style="color: #eab308;">New Delivery Request!</h1>
          <p>Hi Delivery Partner,</p>
          <p>You got a new delivery from Villorita! An order is ready for pickup.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
          </div>
          <p>Log in to your agent app to accept this delivery.</p>
          <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
            Villorita Team
          </p>
        </div>
      `,
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`📧 Delivery Agent notification email sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send delivery agent notification email:', error?.message || error);
    return false;
  }
}
