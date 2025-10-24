# Privacy Policy

**Effective Date:** October 24, 2025
**Last Updated:** October 24, 2025

## Introduction

Houdin ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use the Houdin browser extension (the "Extension").

## Information We Collect

### Locally Stored Data

The Houdin extension stores the following data locally on your device using browser storage APIs:

#### Workflow Data

- **Workflow Definitions**: Custom automation workflows you create, including:
  - Workflow configurations and settings
  - Action sequences and parameters
  - Element selectors and targeting information
  - Custom JavaScript code you write or import

#### Execution Data

- **Workflow Execution History**: Records of workflow runs, including:
  - Execution timestamps and duration
  - Success/failure status
  - Error messages and debugging information
  - URLs where workflows were executed
  - Node execution results and outputs
- **Execution Statistics**: Aggregate counts of successful and failed workflow runs

#### Credentials and Secrets

- **API Keys and Tokens**: Credentials you provide for:
  - HTTP authentication
  - OpenAI API access
  - Custom third-party services
- **Authentication Data**: Login credentials and access tokens for external services

### Data Accessed During Operation

To provide automation functionality, the extension may access:

#### Web Page Content

- **Page Elements**: DOM elements, text content, and structural information from web pages
- **Form Data**: Information you choose to automate or extract from web forms
- **Cookies**: Website cookies when required for automation tasks
- **Navigation Data**: URLs and page navigation information

#### Browser Interactions

- **User Actions**: Clicks, keyboard input, and other interactions you configure in workflows
- **Clipboard Content**: Data copied to/from clipboard during automation tasks
- **Tab Information**: Active tabs and navigation state for workflow execution

## How We Use Your Information

### Local Processing Only

All data processing occurs locally on your device. We use your information to:

- Execute automation workflows you create
- Store and manage your workflow configurations
- Maintain execution history for debugging and monitoring
- Secure and manage your API credentials
- Provide workflow debugging and error reporting

### No Remote Data Transmission

**Important**: The Houdin extension does not transmit any personal data, workflow configurations, or usage information to our servers or any third-party services, except when:

- You explicitly configure workflows to make HTTP requests to external APIs
- You use integrations (like OpenAI) that require API calls to third-party services
- Such external communications are entirely under your control and configuration

## Data Storage and Security

### Local Storage

- All data is stored locally using browser extension storage APIs
- Data persists on your device until you manually delete it or uninstall the extension

### Security Measures

- **Access Control**: Data is only accessible to the Houdin extension
- **No Network Transmission**: No automatic data transmission to external servers
- **Secure APIs**: Use of secure browser extension APIs for all operations

### Data Retention

- Workflow execution history is limited to the most recent 50 executions
- All data remains on your device indefinitely until manually deleted
- Uninstalling the extension removes all stored data

## Third-Party Services

### External API Integrations

When you configure workflows to use external services:

- **Your Responsibility**: You control what data is sent to external APIs
- **Third-Party Policies**: External services have their own privacy policies
- **API Credentials**: You provide and manage your own API keys
- **Data Transmission**: Only data you explicitly configure is transmitted

### Supported Integrations

- OpenAI API (when you provide your API key)
- Custom HTTP APIs (when you configure requests)
- Any web services you choose to integrate

## Your Rights and Controls

### Data Management

You have complete control over your data:

- **View Data**: Access all stored workflows and execution history through the extension interface
- **Delete Data**: Remove individual workflows, execution records, or clear all data
- **Export Data**: Export workflow configurations for backup or sharing
- **Modify Data**: Edit workflows, credentials, and settings at any time

### Extension Permissions

The extension requests the following browser permissions:

- `storage`: Store workflows and settings locally
- `tabs`: Access tab information for workflow execution
- `scripting`: Execute automation scripts on web pages
- `cookies`: Access cookies when required for automation
- `clipboardWrite`: Copy data to clipboard during automation
- `webNavigation`: Monitor page navigation for triggers
- `webRequest`: Listen for HTTP requests when configured
- `userScripts`: Execute user-defined automation scripts
- `<all_urls>`: Access any website for automation (only when workflows are active)

## Children's Privacy

The Houdin extension is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we do:

- We will update the "Last Updated" date at the top of this policy
- We will notify users of significant changes through the extension interface
- Continued use of the extension after changes constitutes acceptance of the updated policy

## Source available and Transparency

Houdin is an source-available project. You can:

- Review the complete source code to understand data handling practices
- Verify that no unauthorized data transmission occurs
- Contribute to the project's development and security

## Contact Information

If you have any questions about this Privacy Policy or the Houdin extension:

- **Email**: help@houdin.dev
- **GitHub Issues**: Report privacy concerns through our GitHub repository
- **Project Repository**: Review the source code and documentation

## Compliance and Legal

### Data Protection

This Privacy Policy is designed to comply with:

- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Other applicable data protection laws

### No Warranty

The extension is provided "as is" without warranties regarding data security or privacy, as outlined in our Terms of Service.

---

**Note**: This privacy policy reflects the extension's current functionality. As a source-available project, you can verify these practices by reviewing the source code. We are committed to maintaining the highest standards of privacy protection while providing powerful automation capabilities.
