import React, { useState } from 'react'
import styles from './Options.module.css'


type Menu = 'settings' | 'about'

const App: React.FC = () => {
  const [currentMenu, setCurrentMenu] = useState<Menu>('settings')
  const [sortValue, setSortValue] = useState<string>('url')

  const handleMenuClick = (menu: Menu) => {
    setCurrentMenu(menu)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortValue(e.target.value)
  }

  const onSave = () => {
    chrome.storage.local.set({ 
        'sortBy': sortValue
     })
  }


  return (
    <div className={styles.App}>
      <div className={styles.sidebar}>
        <button onClick={() => handleMenuClick('settings')}>settings</button>
        <button onClick={() => handleMenuClick('about')}>about</button>
      </div>
      <div className={styles.content}>
        {currentMenu === 'settings' && (
          <div>
            <div>
              <label htmlFor="sort">sortBy</label>
              <select id="sort" onChange={handleSortChange} value={sortValue}>
                <option value="title">title</option>
                <option value="url">url</option>
              </select>
            </div>
            <button onClick={onSave}>save</button>
          </div>
        )}
        {currentMenu === 'about' && (
          <div>
            <p>sort chrome tabs</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
