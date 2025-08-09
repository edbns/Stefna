import React from 'react'

const TestFooter: React.FC = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'yellow',
        color: 'black',
        padding: '20px',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        zIndex: 10000,
        border: '3px solid red'
      }}
    >
      🎉 TEST FOOTER IS WORKING! 🎉
    </div>
  )
}

export default TestFooter 