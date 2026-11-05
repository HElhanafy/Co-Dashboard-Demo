/* load.js - loads the dataset of the chosen industry (24/10/2026) */
(function(){var i='medical';try{i=localStorage.getItem('demoIndustry')||i}catch(e){}if(i!=='trading')i='medical';
window.DEMO_INDUSTRY=i;document.write('<script src="../theme/auth.js?v=1337ab5d"><\/script><script src="../data/data_'+i+'.js"><\/script>')})();
