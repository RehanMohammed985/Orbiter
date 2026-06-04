module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  res.json([
    { id: 'all', label: 'All' },
    { id: 'cs', label: 'CS' },
    { id: 'ai', label: 'AI' },
    { id: 'ml', label: 'ML' },
    { id: 'startups', label: 'Startups' },
  ]);
};
