import { useState, useEffect, useCallback } from 'react';
import { AutoResizedTextArea } from './components/AutoResizedTextArea';
import { generateSymmetricKey, encryptText, exportKeyToString } from './utils/crypto';
import { uploadToBlobse } from './utils/blobse';
import MessageViewer from './components/MessageViewer';
import Button from './components/Button';

function App() {
  const [currentView, setCurrentView] = useState<'create' | 'view'>('create');
  const [inputValue, setInputValue] = useState("Dear friend,\n\nThis is a test message.\n\nSincerely,\nA Coder");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy Link');

  const handleInputValueChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  }, []); // setInputValue from useState is stable, so dependency array can be empty

  const handleCreateLink = async () => {
    setIsCreatingLink(true);
    setGeneratedLink(null);
    setErrorMessage(null);

    if (!inputValue.trim()) {
      setErrorMessage("Message cannot be empty.");
      setIsCreatingLink(false);
      return;
    }

    try {
      const key = await generateSymmetricKey();
      const encryptedData = await encryptText(inputValue, key);
      const blobResourceUrl = await uploadToBlobse(encryptedData);

      const blobId = blobResourceUrl.split('/').pop();
      if (!blobId) {
        throw new Error("Could not extract Blob ID from URL.");
      }

      const keyString = await exportKeyToString(key);
      const link = `${window.location.origin}${window.location.pathname}#/view?id=${blobId}&key=${keyString}`;
      setGeneratedLink(link);
    } catch (error) {
      console.error("Error creating link:", error);
      setErrorMessage('Failed to create link: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCreatingLink(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
        .then(() => {
          setCopyButtonText('Copied!');
          setTimeout(() => setCopyButtonText('Copy Link'), 2000);
        })
        .catch(err => setErrorMessage('Failed to copy link: ' + err));
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#/view')) {
        setCurrentView('view');
      } else {
        setCurrentView('create');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on mount to set initial view

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <>
      {currentView === 'create' ? (
        <div className="min-h-screen bg-neutral-100 text-neutral-800 flex flex-col items-center justify-center p-4 selection:bg-sky-300 selection:text-sky-900 animate-fade-in">
          <div className="container-center space-y-8">
            <h1 className="text-4xl font-bold text-center text-sky-700">Typewriter Messenger</h1>
            
            <div className="bg-white p-6 shadow-lg rounded-md">
              <h2 className="text-2xl mb-4 text-neutral-700">Compose your message:</h2>
              <AutoResizedTextArea
                value={inputValue}
                onChange={handleInputValueChange} // Use the memoized handler
                placeholder="Type your thoughtful message here..."
                className="w-full bg-transparent text-lg focus:outline-none resize-none custom-cursor border border-neutral-300 rounded p-3 min-h-[100px]"
                rows={3}
                autoFocus
              />
              <Button
                onClick={handleCreateLink}
                disabled={isCreatingLink}
                className="mt-4 w-full"
              >
                {isCreatingLink ? 'Creating Link...' : 'Create Shareable Link'}
              </Button>

              {generatedLink && (
                <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded animate-fade-in">
                  <p className="text-neutral-700 mb-2">Share this link:</p>
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="w-full bg-neutral-100 text-sm p-2 border border-neutral-300 rounded mb-2 focus:outline-none"
                  />
                  <Button
                    onClick={copyLinkToClipboard}
                    className="w-full"
                  >
                    {copyButtonText}
                  </Button>
                </div>
              )}

              {errorMessage && (
                <p className="mt-4 text-red-600 text-sm font-medium p-2 bg-red-50 rounded">{errorMessage}</p>
              )}
            </div>

            {/* <div className="bg-white p-6 shadow-lg rounded-md">
              <h2 className="text-2xl mb-4 text-neutral-700">Preview:</h2>
              <TypewriterText
                fullText={inputValue}
                typingSpeed={50}
                className="text-lg leading-relaxed whitespace-pre-wrap p-3 border border-dashed border-neutral-300 rounded min-h-[100px]"
              />
            </div> */}
          </div>
        </div>
      ) : (
        <MessageViewer />
      )}
    </>
  );
}

export default App;
