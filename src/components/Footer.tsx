import React, { useState, useEffect } from 'react';

const Footer: React.FC = () => {
  const [aiDisclaimer, setAiDisclaimer] = useState<string | null>(null);

  // config.jsonからAI_DISCLAIMERを読み込み
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('./config.json');
        const responseText = await response.text();
        
        try {
          const config = JSON.parse(responseText);
          const hasValidEndpoint = config.AI_PROMPT_ENDPOINT && 
                                  typeof config.AI_PROMPT_ENDPOINT === 'string' && 
                                  config.AI_PROMPT_ENDPOINT.trim() !== '' &&
                                  config.AI_PROMPT_ENDPOINT !== 'YOUR_AI_ENDPOINT_URL_HERE';
          
          if (response.ok && hasValidEndpoint && config.AI_DISCLAIMER) {
            setAiDisclaimer(config.AI_DISCLAIMER);
          }
        } catch {
          setAiDisclaimer(null);
        }
      } catch (error) {
        setAiDisclaimer(null);
      }
    };
    loadConfig();
  }, []);

  return (
    <footer className="disclaimer">
      AWS非公式ツールであり、アイコンはAWSの著作物です。
      {aiDisclaimer && aiDisclaimer}
    </footer>
  );
};

export default Footer;