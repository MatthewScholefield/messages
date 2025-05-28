import { useState, useEffect, useCallback } from 'react';
import { AutoResizedTextArea } from './components/AutoResizedTextArea';
import { generateSymmetricKey, encryptText, exportKeyToString } from './utils/crypto';
import { uploadToBlobse } from './utils/blobse';
import MessageViewer from './components/MessageViewer';
import Button from './components/Button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

function App() {
  const [currentView, setCurrentView] = useState<'create' | 'view'>('create');
  const [inputValue, setInputValue] = useState("");
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
          <div className="space-y-8 max-w-2xl w-full">
            <div className="bg-white p-6 shadow-lg rounded-md relative mb-8">
              <AutoResizedTextArea
                value={inputValue}
                onChange={handleInputValueChange} // Use the memoized handler
                placeholder="Type your message here..."
                className="w-full bg-transparent text-lg focus:outline-none"
                rows={3}
                autoFocus
              />
              
              {/* Circular button that appears when there's text */}
              <div className={`absolute transition-all duration-300 -bottom-7 right-4 ${inputValue.trim().length ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <Button
                  onClick={handleCreateLink}
                  disabled={isCreatingLink}
                  variant="circular"
                  icon={
                    isCreatingLink ? (
                      <svg className="animate-spin h-5 w-5 text-black " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <ArrowRightIcon className="w-5 h-5"/>
                    )
                  }
                >
                </Button>
              </div>

              {generatedLink && (
                <div className="mt-10 p-4 bg-neutral-50 border border-neutral-200 rounded animate-fade-in">
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
          </div>
        </div>
      ) : (
        <MessageViewer />
      )}
    </>
  );
}

export default App;
