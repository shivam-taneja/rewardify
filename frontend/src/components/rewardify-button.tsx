const RewardifyButton = () => {
  const handleClick = () => {
    chrome.runtime.sendMessage('open-sidepanel');
  };

  return (
    <button
      onClick={handleClick}
      style={{
        background: '#fff',
        paddingLeft: '1.8rem',
        paddingRight: '1.8rem',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
        borderRadius: '9999px',
        cursor: "pointer"
      }}
    >
      <span style={{ color: '#4c1d95', fontWeight: 800, fontSize: 14 }}>Rewardify</span>
    </button>
  );
};

export default RewardifyButton;