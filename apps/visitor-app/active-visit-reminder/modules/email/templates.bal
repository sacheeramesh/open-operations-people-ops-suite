// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

// Both reminders use the Choreo Labs layout in emailLayout: the logo bar, a dark heading band,
// a white body and a light footer. Each template only supplies its own body. Placeholders are
// written as <!-- [KEY] --> so that bindKeyValues can replace them.

const string FONT = "font-family:'Sora',system-ui,-apple-system,'Segoe UI',Arial,sans-serif;";
const string ASSETS = "https://choreolabs.com/themes/wso2theme/images/choreo/email";
const string SITE = "https://choreolabs.com";

# Email template for visits where the scheduled departure time has passed
# without being marked as complete — reminder that action is required.
# Placeholders: VISIT_ID, VISITOR_NAME, COMPANY, VISIT_DATE,
# TIME_OF_ENTRY, TIME_OF_DEPARTURE, WHOM_THEY_MEET,
# PASS_NUMBER, PURPOSE_OF_VISIT, DAYS_OVERDUE, YEAR
public final string departureOverdueTemplate = emailLayout(
        alertBox("The scheduled departure time for this visit passed <!-- [DAYS_OVERDUE] --> and it has not "
            + "been marked as complete. Please complete this visit immediately.")
        + paragraph("The following visit has not been completed. Please review the details below and complete "
            + "it manually.")
        + detailsTable(
            detailRow("Visit ID", "<!-- [VISIT_ID] -->", true)
            + detailRow("Visitor Name", "<!-- [VISITOR_NAME] -->", false)
            + detailRow("Company", "<!-- [COMPANY] -->", true)
            + detailRow("Visit Date", "<!-- [VISIT_DATE] -->", false)
            + detailRow("Entry Time", "<!-- [TIME_OF_ENTRY] -->", true)
            + detailRow("Scheduled Departure", "<!-- [TIME_OF_DEPARTURE] -->", false)
            + detailRow("Whom They Meet", "<!-- [WHOM_THEY_MEET] -->", true)
            + detailRow("Pass Number", "<!-- [PASS_NUMBER] -->", false)
            + detailRow("Purpose of Visit", "<!-- [PURPOSE_OF_VISIT] -->", true))
);

# Email template for visits that have been active for more than 2 days
# with no departure recorded — reminder that action is required.
# Placeholders: VISIT_ID, VISITOR_NAME, COMPANY, VISIT_DATE,
# TIME_OF_ENTRY, WHOM_THEY_MEET, PASS_NUMBER,
# PURPOSE_OF_VISIT, DAYS_ACTIVE, YEAR
public final string longRunningVisitTemplate = emailLayout(
        alertBox("This visit has been active for <!-- [DAYS_ACTIVE] --> with no scheduled departure time. "
            + "Please review and complete it immediately.")
        + paragraph("The following visit has not been completed. Please review the details below and complete "
            + "it manually.")
        + detailsTable(
            detailRow("Visit ID", "<!-- [VISIT_ID] -->", true)
            + detailRow("Visitor Name", "<!-- [VISITOR_NAME] -->", false)
            + detailRow("Company", "<!-- [COMPANY] -->", true)
            + detailRow("Visit Date", "<!-- [VISIT_DATE] -->", false)
            + detailRow("Entry Time", "<!-- [TIME_OF_ENTRY] -->", true)
            + detailRow("Whom They Meet", "<!-- [WHOM_THEY_MEET] -->", false)
            + detailRow("Pass Number", "<!-- [PASS_NUMBER] -->", true)
            + detailRow("Purpose of Visit", "<!-- [PURPOSE_OF_VISIT] -->", false))
);

# A red box that says what needs to be done.
#
# + content - Text of the box
# + return - The box as HTML
isolated function alertBox(string content) returns string => string `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td class="dm-alert" bgcolor="#FDECEA" style="background-color:#FDECEA; border-left:4px solid #D93025; border-radius:8px; padding:16px 20px;">
      <p class="dm-alert-text" style="margin:0; ${FONT} font-size:15px; line-height:24px; color:#8A1C12; mso-line-height-rule:exactly;">${content}</p>
    </td>
  </tr>
</table>
`;

# A paragraph of body text.
#
# + content - Text of the paragraph
# + return - The paragraph as HTML
isolated function paragraph(string content) returns string =>
    string `<p class="dm-text" style="margin:0 0 16px; ${FONT} font-size:16px; line-height:27px; color:#3F465C; mso-line-height-rule:exactly;">${content}</p>
`;

# A bordered table listing the details of a visit. It is a data table, not a layout table, so it keeps
# its table semantics and each row's label is a row header for screen readers.
#
# + rows - The table rows
# + return - The table as HTML
isolated function detailsTable(string rows) returns string => string `<table width="100%" border="0" cellpadding="0" cellspacing="0" class="dm-border" style="margin:8px 0 0; border:1px solid #E6E8ED; border-collapse:separate; border-radius:12px; overflow:hidden;">
${rows}
</table>
`;

# One row of the details table. Rows are shaded alternately.
#
# + label - Row label
# + value - Row value
# + shaded - Whether the row has the shaded background
# + return - The row as HTML
isolated function detailRow(string label, string value, boolean shaded) returns string {
    string background = shaded ? "#F4F6FA" : "#FFFFFF";
    string rowClass = shaded ? "dm-panel" : "dm-card";
    return string `<tr>
  <th scope="row" class="${rowClass} dm-head" bgcolor="${background}" style="background-color:${background}; width:40%; padding:12px 16px; ${FONT} font-size:14px; line-height:20px; font-weight:600; color:#050A1C; text-align:left; vertical-align:top; mso-line-height-rule:exactly;">${label}</th>
  <td class="${rowClass} dm-text" bgcolor="${background}" style="background-color:${background}; padding:12px 16px; ${FONT} font-size:14px; line-height:20px; color:#3F465C; overflow-wrap:anywhere; word-break:break-word; mso-line-height-rule:exactly;">${value}</td>
</tr>
`;
}

# Wraps a reminder body in the Choreo Labs layout.
#
# + body - HTML of the white body
# + return - The complete email as HTML
isolated function emailLayout(string body) returns string => string `<!DOCTYPE html>
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
<title>Choreo Labs Visitor Management</title>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600&display=swap" rel="stylesheet" type="text/css">
<style type="text/css">@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600&display=swap');</style>
<!--<![endif]-->
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style type="text/css">
  body, table, th, td, div, p, a, span, h1 { font-family: 'Segoe UI', Arial, sans-serif !important; mso-line-height-rule: exactly; }
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

  @media only screen and (max-width: 620px) {
    .outer-pad { padding-left: 10px !important; padding-right: 10px !important; }
    .px        { padding-left: 24px !important; padding-right: 24px !important; }
    .pt-hero   { padding-top: 48px !important; }
    .pb-hero   { padding-bottom: 48px !important; }
    .h1        { font-size: 30px !important; line-height: 36px !important; letter-spacing: -0.8px !important; }
  }

  /* Dark mode in clients that honour it (Apple Mail, iOS Mail, Outlook Mac, Outlook.com). */
  @media (prefers-color-scheme: dark) {
    .dm-page  { background-color: #000000 !important; background-image: none !important; }
    .logo-light { display: none !important; }
    .logo-dark  { display: block !important; max-height: none !important; overflow: visible !important; }
    .dm-card  { background-color: #262626 !important; }
    .dm-panel { background-color: #333333 !important; }
    .dm-border { border-color: #3A3A3A !important; }
    .dm-alert { background-color: #3B1D1A !important; }
    .dm-alert-text { color: #F6C1BA !important; }
    .dm-head  { color: #FFFFFF !important; }
    .dm-text  { color: #C9CDD6 !important; }
  }
  [data-ogsc] .dm-head  { color: #FFFFFF !important; }
  [data-ogsc] .dm-text  { color: #C9CDD6 !important; }
  [data-ogsc] .dm-alert-text { color: #F6C1BA !important; }
  [data-ogsc] .logo-light { display: none !important; }
  [data-ogsc] .logo-dark  { display: block !important; max-height: none !important; overflow: visible !important; }
  [data-ogsb] .dm-page  { background-color: #000000 !important; background-image: none !important; }
  [data-ogsb] .dm-card  { background-color: #262626 !important; }
  [data-ogsb] .dm-panel { background-color: #333333 !important; }
  [data-ogsb] .dm-alert { background-color: #3B1D1A !important; }

  /* Gmail apps invert colours in dark mode. These keep the white heading text white. */
  u + .body .gm-screen, u + #body .gm-screen         { background: #000000; mix-blend-mode: screen; }
  u + .body .gm-difference, u + #body .gm-difference { background: #000000; mix-blend-mode: difference; }
</style>
</head>

<body id="body" class="body dm-page" style="margin:0; padding:0; width:100%; word-spacing:normal; background-color:#EEF0F3; -webkit-font-smoothing:antialiased;">
<div role="article" aria-roledescription="email" aria-label="Choreo Labs Visitor Management" lang="en" dir="ltr" style="font-size:16px;">
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
              <p style="margin:0 0 16px; ${FONT} font-size:13px; line-height:20px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#AEB6C6; mso-line-height-rule:exactly;"><span class="gm-screen"><span class="gm-difference" style="color:#AEB6C6;">Visitor Management</span></span></p>
              <h1 class="h1" style="margin:0; ${FONT} font-size:40px; line-height:46px; font-weight:600; letter-spacing:-1.2px; color:#FFFFFF; word-wrap:break-word; overflow-wrap:break-word; mso-line-height-rule:exactly;"><span class="gm-screen"><span class="gm-difference" style="color:#FFFFFF;">Immediate Action Required</span></span></h1>
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
                  <td align="left" style="${FONT} font-size:12px; line-height:19px; color:#5B6275; mso-line-height-rule:exactly;">
                    <p style="margin:0;">&copy; <!-- [YEAR] --> Choreo Labs LLC. This is an automated notification from the Visitor Management Scheduler.</p>
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
