// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

// Every email uses the Choreo Labs layout in emailLayout: the logo bar, a dark heading band,
// a white body and a light footer. Each template only supplies its own body. Placeholders are
// written as <!-- [KEY] --> so that bindKeyValues can replace them.

const string FONT = "font-family:'Sora',system-ui,-apple-system,'Segoe UI',Arial,sans-serif;";
const string ASSETS = "https://choreolabs.com/themes/wso2theme/images/choreo/email";
const string SITE = "https://choreolabs.com";

# Email sent to a visitor who has been invited, with the QR code they show at the security desk.
public final string inviteTemplate = emailLayout(
        title = "Choreo Labs Application Status",
        heading = "You have been invited!",
        body = greeting("Dear <!-- [FIRST_NAME] -->,")
            + paragraph("We're pleased to inform you that you are invited to visit Choreo Labs.<br>"
                + "For a seamless entry experience, please present the QR code included in this email at the "
                + "security desk upon your arrival.")
            + detailsPanel("Visit Details",
                detailItem("Visitor:", "<!-- [NAME] -->")
                + detailItem("Visit Date :", "<!-- [VISIT_DATE] -->")
                + "<!-- [TIME_OF_ENTRY] -->\n<!-- [TIME_OF_DEPARTURE] -->\n<!-- [PURPOSE_OF_VISIT] -->\n"
                + "<!-- [WHO_THEY_MEET] -->\n<!-- [ALLOWED_FLOORS] -->")
            + qrCode()
            + paragraph("If you require any further assistance, please do not hesitate to contact us at "
                + contactLink() + ".")
            + paragraph("Thank you for your cooperation.", margin = "0 0 32px")
            + signature()
);

# Email sent to a visitor once their visit is completed.
public final string visitorCompletionTemplate = emailLayout(
        title = "Choreo Labs Visitor Status",
        heading = "Visit Completed!",
        body = greeting("Dear <!-- [FIRST_NAME] -->,")
            + paragraph("Your visit to Choreo Labs has been successfully completed. We hope you had a great "
                + "experience with us.")
            + detailsPanel("Visit Details",
                detailItem("Visitor:", "<!-- [NAME] -->")
                + "<!-- [TIME_OF_ENTRY] -->\n<!-- [TIME_OF_DEPARTURE] -->\n<!-- [PASS_NUMBER] -->\n"
                + "<!-- [ALLOWED_FLOORS] -->")
            + paragraph("Thank you for visiting Choreo Labs. We appreciate your time and cooperation throughout "
                + "the visit process.")
            + paragraph("We would love to hear your thoughts about your visit! You can reach us anytime at "
                + contactLink() + ".")
            + paragraph("Thank you for your cooperation.", margin = "0 0 32px")
            + signature()
);

# Email sent to a visitor when they check in at the security desk and the visit starts.
public final string visitorApproveTemplate = emailLayout(
        title = "Choreo Labs Application Status",
        heading = "Visit Approved!",
        body = greeting("Dear <!-- [FIRST_NAME] -->,")
            + paragraph("Your visit to Choreo Labs has officially started.<br>"
                + "You have successfully checked in at the security desk using your QR code. You may now "
                + "proceed as guided by security or your host.")
            + detailsPanel("Visit Details",
                detailItem("Visitor:", "<!-- [NAME] -->")
                + "<!-- [TIME_OF_ENTRY] -->\n<!-- [TIME_OF_DEPARTURE] -->\n<!-- [PASS_NUMBER] -->\n"
                + "<!-- [ALLOWED_FLOORS] -->")
            + paragraph("If you require any further assistance, please do not hesitate to contact us at "
                + contactLink() + ".")
            + paragraph("Thank you for your cooperation.", margin = "0 0 32px")
            + signature()
);

# Email sent to the host and the creator of a visit request when it is rejected.
public final string hostVisitRejectionTemplate = emailLayout(
        title = "Choreo Labs Visitor Status",
        heading = "Visit Rejected!",
        body = greeting("Hello,")
            + paragraph("The visit request below has been rejected. You are receiving this email because you are "
                + "the host of this visit or created the request.")
            + paragraph("The visitor has not been notified. Please let them know, and submit a new visit request "
                + "if the visit should still go ahead.")
            + detailsPanel("Visit Details",
                detailItem("Visitor:", "<!-- [NAME] -->")
                + detailItem("Company:", "<!-- [COMPANY_NAME] -->")
                + "<!-- [TIME_OF_ENTRY] -->\n<!-- [TIME_OF_DEPARTURE] -->\n"
                + detailItem("Rejected by:", "<!-- [REJECTED_BY] -->")
                + detailItem("Reason:", "<!-- [REJECTION_REASON] -->"))
            + paragraph("If you require any further assistance, please do not hesitate to contact us at "
                + contactLink() + ".", margin = "0 0 32px")
            + signature()
);

# Email sent to the host when their visitor checks in at the security desk.
public final string employeeVisitorArrivalTemplate = emailLayout(
        title = "Choreo Labs Application Status",
        heading = "Visitor Arrival Notification!",
        body = greeting("Dear <!-- [HOST_NAME] -->,")
            + paragraph("Your visitor, <!-- [VISITOR_NAME] -->, has arrived at Choreo Labs and successfully "
                + "checked in at the security desk.")
            + detailsPanel("Visitor Details",
                detailItem("Visitor:", "<!-- [VISITOR_NAME] -->")
                + detailItem("Check-In Time :", "<!-- [CHECK_IN_TIME] -->")
                + "<!-- [LOCATION] -->\n<!-- [PURPOSE_OF_VISIT] -->")
            + paragraph("Security will guide the visitor to the appropriate location if needed. You may now "
                + "proceed to meet your visitor.")
            + paragraph("If you require any further assistance, please do not hesitate to contact us at "
                + contactLink() + ".", margin = "0 0 32px")
            + signature()
);

# Opening line of an email, such as "Dear <name>,".
#
# + content - Text of the line
# + return - The line as HTML
isolated function greeting(string content) returns string =>
    string `<p class="dm-head" style="margin:0 0 16px; ${FONT} font-size:17px; line-height:26px; font-weight:600; color:#050A1C; mso-line-height-rule:exactly;">${content}</p>
`;

# A paragraph of body text.
#
# + content - Text of the paragraph, which may contain inline HTML
# + margin - CSS margin of the paragraph
# + return - The paragraph as HTML
isolated function paragraph(string content, string margin = "0 0 16px") returns string =>
    string `<p class="dm-text" style="margin:${margin}; ${FONT} font-size:16px; line-height:27px; color:#3F465C; mso-line-height-rule:exactly;">${content}</p>
`;

# A link to the contact email address.
#
# + return - The link as HTML
isolated function contactLink() returns string =>
    string `<a href="mailto:<!-- [CONTACT_EMAIL] -->" target="_blank" class="dm-link" style="color:#050A1C; text-decoration:underline; font-weight:600;"><!-- [CONTACT_EMAIL] --></a>`;

# A light panel listing the details of a visit.
#
# The rows the service fills in carry their own inline styles. The "details" class lets the stylesheet
# in emailLayout bring them in line with the rows written here.
#
# + heading - Panel heading
# + items - The list items
# + return - The panel as HTML
isolated function detailsPanel(string heading, string items) returns string => string `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
  <tr>
    <td class="dm-panel panel-pad" bgcolor="#F4F6FA" style="background-color:#F4F6FA; border-radius:12px; padding:24px 28px 16px;">
      <p class="dm-head" style="margin:0 0 12px; ${FONT} font-size:13px; line-height:20px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#050A1C;">${heading}</p>
      <ul class="details" style="margin:0; padding:0 0 0 20px; ${FONT} font-size:15px; line-height:24px; color:#EB5628;">
${items}
      </ul>
    </td>
  </tr>
</table>
`;

# One row of a details panel.
#
# + label - Row label
# + value - Row value
# + return - The row as HTML
isolated function detailItem(string label, string value) returns string =>
    string `<li><p style="margin:0 0 8px; ${FONT} font-size:15px; line-height:24px; color:#3F465C; overflow-wrap:anywhere; word-break:break-word;"><strong style="color:#050A1C; font-weight:600;">${label}</strong> <span>${value}</span></p></li>
`;

# The visit's QR code, attached to the email as an inline image.
#
# + return - The QR code as HTML
isolated function qrCode() returns string => string `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:0 0 24px;">
      <img src="cid:<!-- [CONTENT_ID] -->" alt="QR Code" width="400" height="400" style="display:block; width:100%; max-width:400px; height:auto; border:0;">
    </td>
  </tr>
</table>
`;

# The sign-off at the end of an email.
#
# + return - The sign-off as HTML
isolated function signature() returns string =>
    paragraph("Best regards,", margin = "0")
    + string `<p class="dm-head" style="margin:4px 0 0; ${FONT} font-size:16px; line-height:24px; font-weight:600; color:#050A1C; mso-line-height-rule:exactly;">Administration Team</p>
`;

# Wraps an email body in the Choreo Labs layout.
#
# + title - Text of the HTML title element
# + heading - Heading shown in the dark band at the top
# + body - HTML of the white body
# + return - The complete email as HTML
isolated function emailLayout(string title, string heading, string body) returns string => string `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${title}</title>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600&display=swap" rel="stylesheet" type="text/css">
<style type="text/css">@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600&display=swap');</style>
<!--<![endif]-->
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style type="text/css">
  body, table, td, div, p, a, span, h1, li { font-family: 'Segoe UI', Arial, sans-serif !important; mso-line-height-rule: exactly; }
  a { text-decoration: none; }
</style>
<![endif]-->
<style type="text/css">
  html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; width: 100% !important; }
  * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; border-collapse: collapse; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
  a { text-decoration: none; }
  a[x-apple-data-detectors], .unstyle-auto-detected-links a {
    color: inherit !important; text-decoration: none !important; font-size: inherit !important;
    font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;
  }
  .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
  .foot-link { transition: color .2s ease; }
  .foot-link:hover { color: #D2461B !important; }

  /* Visit details: the rows the service fills in carry their own inline styles. Long unbroken
     values (a pasted link or ID) wrap instead of widening the email. */
  ul.details li { color: #EB5628; }
  ul.details li p {
    margin: 0 0 8px !important; font-family: 'Sora', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif !important;
    font-size: 15px !important; line-height: 24px !important; color: #3F465C !important;
    overflow-wrap: anywhere; word-break: break-word;
  }
  ul.details strong { color: #050A1C; font-weight: 600; }
  ul.details ul {
    margin: 0 0 8px !important; padding-left: 0 !important; list-style: none;
    font-family: 'Sora', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif !important;
    font-size: 15px !important; line-height: 24px !important; color: #3F465C !important;
    overflow-wrap: anywhere; word-break: break-word;
  }

  @media only screen and (max-width: 620px) {
    .outer-pad { padding-left: 10px !important; padding-right: 10px !important; }
    .px        { padding-left: 24px !important; padding-right: 24px !important; }
    .pt-hero   { padding-top: 48px !important; }
    .pb-hero   { padding-bottom: 48px !important; }
    .h1        { font-size: 30px !important; line-height: 36px !important; letter-spacing: -0.8px !important; }
    .panel-pad { padding: 20px 20px 12px !important; }
    .foot-nav a { display: inline-block !important; padding: 10px 0 !important; margin-right: 22px !important; }
    .foot-nav .sep { display: none !important; }
  }

  /* Dark mode in clients that honour it (Apple Mail, iOS Mail, Outlook Mac, Outlook.com). */
  @media (prefers-color-scheme: dark) {
    .dm-page  { background-color: #000000 !important; background-image: none !important; }
    .logo-light { display: none !important; }
    .logo-dark  { display: block !important; max-height: none !important; overflow: visible !important; }
    .dm-card  { background-color: #262626 !important; }
    .dm-panel { background-color: #333333 !important; }
    .dm-head  { color: #FFFFFF !important; }
    .dm-text  { color: #C9CDD6 !important; }
    .dm-link  { color: #FFFFFF !important; }
    ul.details li p, ul.details ul { color: #C9CDD6 !important; }
    ul.details strong { color: #FFFFFF !important; }
  }
  [data-ogsc] .dm-head  { color: #FFFFFF !important; }
  [data-ogsc] .dm-text  { color: #C9CDD6 !important; }
  [data-ogsc] .dm-link  { color: #FFFFFF !important; }
  [data-ogsc] ul.details li p, [data-ogsc] ul.details ul { color: #C9CDD6 !important; }
  [data-ogsc] ul.details strong { color: #FFFFFF !important; }
  [data-ogsc] .logo-light { display: none !important; }
  [data-ogsc] .logo-dark  { display: block !important; max-height: none !important; overflow: visible !important; }
  [data-ogsb] .dm-page  { background-color: #000000 !important; background-image: none !important; }
  [data-ogsb] .dm-card  { background-color: #262626 !important; }
  [data-ogsb] .dm-panel { background-color: #333333 !important; }

  /* Gmail apps invert colours in dark mode. These keep the white heading text white. */
  u + .body .gm-screen, u + #body .gm-screen         { background: #000000; mix-blend-mode: screen; }
  u + .body .gm-difference, u + #body .gm-difference { background: #000000; mix-blend-mode: difference; }
</style>
</head>

<body id="body" class="body dm-page" style="margin:0; padding:0; width:100%; word-spacing:normal; background-color:#EEF0F3; -webkit-font-smoothing:antialiased;">
<div role="article" aria-roledescription="email" aria-label="${title}" lang="en" dir="ltr" style="font-size:16px;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="dm-page" bgcolor="#EEF0F3" style="width:100%; background-color:#EEF0F3; background-image:linear-gradient(#EEF0F3,#EEF0F3);">
    <tr>
      <td align="center" valign="top" class="outer-pad" style="padding:0 16px;">
        <!--[if mso]><table role="presentation" width="640" align="center" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%; max-width:640px; margin:0 auto;">

          <!-- Logo: the dark logo on a light chip, swapped for the white logo in dark mode. -->
          <tr>
            <td align="left" style="padding:16px 6px 16px 0;">
              <a href="${SITE}/" target="_blank" style="text-decoration:none;"><img class="logo-light" src="${ASSETS}/choreo-labs-logo-chip-grey.png" width="170" height="38" alt="Choreo Labs" style="display:block; width:170px; max-width:170px; height:auto; border:0; color:#050A1C; font-family:Arial,sans-serif; font-size:18px; line-height:22px; font-weight:bold;"><!--[if !mso]><!--><div class="logo-dark" style="display:none; max-height:0; overflow:hidden; mso-hide:all; padding:8px;"><img src="${ASSETS}/choreo-labs-white.png" width="154" height="22" alt="Choreo Labs" style="display:block; width:154px; max-width:154px; height:auto; border:0; color:#FFFFFF; font-family:Arial,sans-serif; font-size:18px; line-height:22px; font-weight:bold;"></div><!--<![endif]--></a>
            </td>
          </tr>

          <!-- Heading band -->
          <tr>
            <td class="px pt-hero pb-hero" align="left" bgcolor="#050A1C" style="background-color:#050A1C; background-image:linear-gradient(#050A1C,#050A1C); border-radius:16px 16px 0 0; padding:64px 7.5% 64px; mso-padding-alt:64px 48px 64px 48px;">
              <p style="margin:0 0 16px; ${FONT} font-size:13px; line-height:20px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#AEB6C6; mso-line-height-rule:exactly;"><span class="gm-screen"><span class="gm-difference" style="color:#AEB6C6;">Visitor Registration</span></span></p>
              <h1 class="h1" style="margin:0; ${FONT} font-size:40px; line-height:46px; font-weight:600; letter-spacing:-1.2px; color:#FFFFFF; word-wrap:break-word; overflow-wrap:break-word; mso-line-height-rule:exactly;"><span class="gm-screen"><span class="gm-difference" style="color:#FFFFFF;">${heading}</span></span></h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="dm-card px" bgcolor="#FFFFFF" style="background-color:#FFFFFF; padding:48px 7.5% 48px; mso-padding-alt:48px 48px 48px 48px;">
${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#F4F6FA" class="px" style="background-color:#F4F6FA; border-top:1px solid #E6E8ED; border-radius:0 0 16px 16px; padding:40px 7.5% 40px; mso-padding-alt:40px 48px 40px 48px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="foot-nav" align="left" style="padding:0 0 16px; ${FONT} font-size:13px; line-height:20px; font-weight:600; color:#050A1C;">
                    <a href="${SITE}/contact/" target="_blank" class="foot-link" style="display:inline-block; padding:4px 0; color:#050A1C; text-decoration:none;">Contact Us</a><span class="sep" style="color:#B4B9C5;">&nbsp;&nbsp;|&nbsp;</span> <a href="${SITE}/privacy-policy" target="_blank" class="foot-link" style="display:inline-block; padding:4px 0; color:#050A1C; text-decoration:none;">Privacy Policy</a><span class="sep" style="color:#B4B9C5;">&nbsp;&nbsp;|&nbsp;</span> <a href="${SITE}/subscription/" target="_blank" class="foot-link" style="display:inline-block; padding:4px 0; color:#050A1C; text-decoration:none;">Get Support</a>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="${FONT} font-size:12px; line-height:19px; color:#5B6275; mso-line-height-rule:exactly;">
                    <p style="margin:0;">&copy; <!-- [YEAR] --> Choreo Labs LLC. All Rights Reserved.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 0 0;">
                    <img src="${ASSETS}/choreo-labs-footer-watermark.png" width="544" alt="" role="presentation" style="display:block; width:100%; max-width:544px; height:auto; border:0;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="32" style="height:32px; font-size:0; line-height:0;">&nbsp;</td></tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</div>
</body>
</html>
`;
