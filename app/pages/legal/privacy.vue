<template>
  <div class="min-h-screen bg-default">
    <div class="max-w-4xl mx-auto px-4 py-12">
      <article class="prose prose-lg dark:prose-invert max-w-none">
        <h1>Privacy Policy</h1>
        <p class="text-muted"><strong>Last Updated:</strong> January 11, 2026 | <strong>Version:</strong> 1.0</p>
        
        <h2>1. Introduction</h2>
        <p>This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application. We are committed to protecting your privacy and handling your data in an open and transparent manner.</p>
        
        <h2>2. Information We Collect</h2>
        <h3>2.1 Information You Provide</h3>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, phone number (optional)</li>
          <li><strong>Business Information:</strong> Business name, company code</li>
          <li><strong>Consent Preferences:</strong> Marketing and analytics preferences</li>
        </ul>
        
        <h3>2.2 Information Collected Automatically</h3>
        <ul>
          <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
          <li><strong>Usage Data:</strong> Pages visited, features used, session duration</li>
          <li><strong>Log Data:</strong> IP address, access times, error logs</li>
        </ul>
        
        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and maintain our services</li>
          <li>Process your account registration</li>
          <li>Send transactional emails (magic links, notifications)</li>
          <li>Improve our services based on usage patterns</li>
          <li>Ensure security and prevent fraud</li>
          <li>Comply with legal obligations</li>
        </ul>
        
        <h2>4. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Rectification:</strong> Correct inaccurate information</li>
          <li><strong>Erasure:</strong> Delete your account and data</li>
          <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
          <li><strong>Object:</strong> Opt out of marketing communications</li>
        </ul>
        <p>To exercise these rights, visit <NuxtLink to="/dashboard/settings/privacy">Settings > Privacy & Data</NuxtLink> in your dashboard.</p>
        
        <h2>5. Data Retention</h2>
        <ul>
          <li><strong>Active Accounts:</strong> As long as your account is active</li>
          <li><strong>Deleted Accounts:</strong> 30 days after deletion request</li>
          <li><strong>Audit Logs:</strong> 2 years for compliance purposes</li>
        </ul>
        
        <h2>6. Security</h2>
        <p>We implement appropriate technical and organizational measures including:</p>
        <ul>
          <li>Encryption of data in transit (TLS)</li>
          <li>Secure session management</li>
          <li>Regular security audits</li>
          <li>Access controls and audit logging</li>
        </ul>
        
        <h2>7. Contact Us</h2>
        <p>For privacy-related questions or concerns, please contact us at privacy@example.com</p>
        
        <p class="text-sm text-muted mt-8"><em>This privacy policy complies with GDPR, CCPA, and other applicable privacy regulations.</em></p>
      </article>
      
      <div class="mt-12 pt-8 border-t border-default">
        <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">
          Back to Home
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: 'Privacy Policy'
})
</script>
