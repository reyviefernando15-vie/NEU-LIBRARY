// Step 4: Get user's own logs (REALTIME)
      // Gagamit tayo ng .on para kusa itong mag-update pag may bagong log
      db.ref('logs').orderByChild('id').equalTo(rawId).limitToLast(5).on('value', (logSnap) => {
        let html = "";
        let logsArray = [];
        
        logSnap.forEach(child => {
          logsArray.push(child.val());
        });

        // I-reverse para pinakabago ang nasa taas
        logsArray.reverse().forEach(l => {
          const [legacyDate, legacyTime] = (l.timestamp || "").split(', ');
          const dateValue = l.date || legacyDate || "";
          const timeValue = l.time || legacyTime || "";
          html += `<tr><td>${dateValue}</td><td>${timeValue}</td></tr>`;
        });
        
        document.getElementById('logBody').innerHTML = html || "<tr><td colspan='2'>No logs found.</td></tr>";
      });