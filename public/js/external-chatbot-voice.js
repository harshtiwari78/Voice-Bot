(async function() {
  const scriptTag = document.currentScript;

  // Safely construct URL - handle both relative and absolute URLs
  let chatbotHostOrigin;
  try {
    const scriptSrc = scriptTag.getAttribute('src');
    if (!scriptSrc) {
      throw new Error('Script src attribute is missing');
    }

    // If the src is relative, construct absolute URL using current page origin
    let absoluteUrl;
    if (scriptSrc.startsWith('http://') || scriptSrc.startsWith('https://')) {
      // Already absolute URL
      absoluteUrl = scriptSrc;
    } else {
      // Relative URL - construct absolute URL
      absoluteUrl = new URL(scriptSrc, window.location.origin).href;
    }

    const url = new URL(absoluteUrl);
    chatbotHostOrigin = url.origin;
  } catch (error) {
    console.error('❌ Failed to parse script URL:', error);
    // Fallback to current page origin
    chatbotHostOrigin = window.location.origin;
  }

  const chatBotUuid = scriptTag.getAttribute('data-chatbot-uuid');
  const language = scriptTag.getAttribute('data-language') || 'en';
  const position = scriptTag.getAttribute('data-position') || 'right';
  const theme = scriptTag.getAttribute('data-theme') || 'light';
  const openRouterApiKey = scriptTag.getAttribute('data-openrouter-key') || '';
  
  console.log('🤖 VAPI Voice Bot Initializing...', {
    uuid: chatBotUuid,
    language,
    position,
    theme,
    origin: chatbotHostOrigin
  });
  
  // Wait for page to load before initializing
  window.addEventListener('load', function() {
    console.log('Page loaded, initializing voice bot...');
    initializeVoiceBot();
  });
  
  function initializeVoiceBot() {
    // Check bot status and create appropriate widget
    checkBotStatus().then(isActive => {
      if (isActive && window.botInfo?.vapiAssistantId) {
        createVoiceWidget();
      } else {
        createPendingWidget();
      }
    }).catch(error => {
      console.error('Error checking bot status:', error);
      createPendingWidget();
    });
  }
  
  async function checkBotStatus() {
    try {
      const response = await fetch(`${chatbotHostOrigin}/api/bots/status/${chatBotUuid}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      // Store bot info globally for VAPI integration
      if (result.success) {
        window.botInfo = {
          uuid: result.uuid,
          name: result.name,
          status: result.status,
          vapiAssistantId: result.vapiAssistantId
        };
        console.log('✅ Bot status retrieved:', window.botInfo);
        return result.success && result.status === 'active' && !!result.vapiAssistantId;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to check bot status:', error);
      
      // Don't create fallback - just show pending
      window.botInfo = null;
      return false;
    }
  }