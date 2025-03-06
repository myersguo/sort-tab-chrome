import React from 'react'

const Popup: React.FC = () => {
  React.useEffect(() => {
    sortTabs()
  }, []);

  const sortTabs = async () => {
    const result = await chrome.storage.local.get(['sortBy'])
    chrome.runtime.sendMessage(
      {
        action: 'sortTabs',
        sortBy: result.sortBy || 'url',
      },
      function (response) {
        if (response.message === 'success') {
          window.close()
        }
      }
    )
  }

  return <div></div>
}

export default Popup
