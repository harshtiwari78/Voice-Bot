'use client';

import { useEffect } from 'react';

export default function TestEmbedPage() {
  useEffect(() => {
    // Dynamically load the voice bot script
    const script = document.createElement('script');
    script.defer = true;
    script.src = '/js/external-chatbot-voice.js';
    script.setAttribute('data-chatbot-uuid', '61ff25b8-896e-4b74-9161-1f4872a9b53b');
    script.setAttribute('data-language', 'en');
    script.setAttribute('data-position', 'right');
    script.setAttribute('data-theme', 'light');

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Also remove the voice bot container if it exists
      const container = document.getElementById('vapi-voice-bot-container');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  return (
    <div style={{
      margin: 0,
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      lineHeight: 1.6
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1>Voice Bot Embed Test Page</h1>
        <p>This is a test page to check the embedded voice bot functionality and positioning.</p>
        <p><strong>Test Instructions:</strong></p>
        <ul>
          <li>The voice bot button should appear in the bottom-right corner</li>
          <li>It should stay fixed in position when you scroll</li>
          <li>The button should be clickable and not move with page content</li>
        </ul>

        <div style={{
          height: '200vh',
          background: 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h2>Scroll Test Content</h2>
          <p>Scroll down to test if the voice bot button stays fixed in position...</p>
          <p>The button should remain visible and in the same position relative to the viewport.</p>
          <p>This content is intentionally tall to enable scrolling.</p>
          <br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
          <p>More content to scroll through...</p>
          <br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
          <p>Even more content...</p>
          <br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
          <p>Bottom of the test content. The voice bot should still be visible and fixed.</p>
        </div>
      </div>
    </div>
  );
}
