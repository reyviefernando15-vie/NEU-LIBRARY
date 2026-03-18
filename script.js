if (db) {
      // Step 4: Get user's own logs (REALTIME)
      db.ref('logs').orderByChild('id').equalTo(rawId).limitToLast(5).on('value', (logSnap) => {
        let html = "";
        let logsArray = [];
        
        logSnap.forEach(child => {
          logsArray.push(child.val());
        });

        // I-reverse para pinakabago ang nasa taas
        logsArray.reverse().forEach(l => {
          const dateValue = l.date || "";
          const timeValue = l.time || "";
          html += `<tr><td>${dateValue}</td><td>${timeValue}</td></tr>`;
        });
        
        document.getElementById('logBody').innerHTML = html || "<tr><td colspan='2'>No logs found.</td></tr>";
      });
    }
