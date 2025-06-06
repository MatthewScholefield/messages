import { useEffect, useState } from 'react';
import { TypewriterText } from './TypewriterText';
import { importKeyFromString, decryptText } from '../utils/crypto';
import { fetchFromBlobse } from '../utils/blobse';

const MessageViewer = () => {
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [id, setId] = useState<string | null>(null);

  // Effect for Fetching and Decryption
  useEffect(() => {
    const fetchAndDecryptMessage = async () => {
      setIsLoading(true);
      setDecryptedMessage(null);
      setErrorMessage(null);

      const hash = window.location.hash;
      const params = new URLSearchParams(hash.split('?')[1]);
      const id = params.get('id');
      const keyString = params.get('key');
      setId(id); // Store the ID for potential future use

      if (!id || !keyString) {
        setErrorMessage("Invalid link: Missing ID or key.");
        setIsLoading(false);
        return;
      }

      try {
        const importedKey = await importKeyFromString(keyString);
        const blobUrl = `https://blobse.us.to/blob/${id}`;
        const encryptedData = await fetchFromBlobse(blobUrl);
        const message = await decryptText(encryptedData, importedKey);
        setDecryptedMessage(message);
      } catch (error) {
        console.error("Error fetching or decrypting message:", error);
        setErrorMessage("Failed to load message. It might be invalid or expired.");
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', fetchAndDecryptMessage);
    // Initial fetch on mount
    fetchAndDecryptMessage();

    return () => {
      window.removeEventListener('hashchange', fetchAndDecryptMessage);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  return (
    <div className="min-h-screen bg-white text-neutral-800 flex flex-col items-center justify-center p-4 selection:bg-sky-300 selection:text-sky-900 animate-fade-in">
      <div className="container-center space-y-8">
        {errorMessage && <p className="mt-4 text-red-600 text-sm font-medium p-2 bg-red-50 rounded">{errorMessage}</p>}
        {id && decryptedMessage && (
          <div className="p-6">
            <TypewriterText
              messageId={id} // Pass the ID for potential future use
              fullText={decryptedMessage}
              className="text-lg leading-relaxed whitespace-pre-wrap space-y-4"
            />
          </div>
        )}
        {!isLoading && !errorMessage && !decryptedMessage && (
          <p className="text-center text-lg text-neutral-500">Message will appear here. Invalid link.</p>
        )}
      </div>
    </div>
  );
};

export default MessageViewer;