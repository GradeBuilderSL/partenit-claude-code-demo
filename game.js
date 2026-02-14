(function () {
  // Check configuration on load
  window.addEventListener('DOMContentLoaded', function () {
    checkConfiguration();
    setupConfigModal();
  });

  var canvas = document.getElementById('warehouse');
  if (!canvas) return;

  function getGameSessionId() {
    try {
      var sid = localStorage.getItem(CONFIG.STORAGE_KEYS.GAME_SESSION_ID);
      if (sid) return sid;
    } catch (e) { }
    var u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    try { localStorage.setItem(CONFIG.STORAGE_KEYS.GAME_SESSION_ID, u); } catch (e) { }
    return u;
  }

  var gameSessionId = getGameSessionId();

  function gameHeaders(includeJson) {
    var h = {
      'X-Game-Session': gameSessionId
    };
    if (includeJson !== false) h['Content-Type'] = 'application/json';
    return h;
  }

  function saveSessionId(data) {
    if (data && data.session_id) {
      gameSessionId = data.session_id;
      try { localStorage.setItem(CONFIG.STORAGE_KEYS.GAME_SESSION_ID, data.session_id); } catch (e) { }
    }
  }

  window.gameHeaders = gameHeaders;
  window.saveSessionId = saveSessionId;
  var ctx = canvas.getContext('2d');
  var W = canvas.width;
  var H = canvas.height;
  var GRID_W = 12;
  var GRID_H = 8;

  function toPx(x, y) {
    return {
      px: (x / GRID_W) * (W - 40) + 20,
      py: H - 20 - (y / GRID_H) * (H - 40),
    };
  }

  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function setBar(id, val) {
    var el = document.getElementById(id);
    if (el) el.style.width = Math.max(0, Math.min(100, val)) + '%';
  }

  function drawWarehouse(state) {
    if (!state) return;
    // Clear
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Grid
    var sx = (W - 40) / GRID_W;
    var sy = (H - 40) / GRID_H;
    ctx.strokeStyle = 'rgba(88,166,255,0.1)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= GRID_W; gx++) {
      var px = 20 + gx * sx;
      ctx.beginPath();
      ctx.moveTo(px, 20);
      ctx.lineTo(px, H - 20);
      ctx.stroke();
    }
    for (var gy = 0; gy <= GRID_H; gy++) {
      var py = 20 + gy * (H - 40) / GRID_H;
      ctx.beginPath();
      ctx.moveTo(20, py);
      ctx.lineTo(W - 20, py);
      ctx.stroke();
    }

    // Shelves
    (state.shelves || []).forEach(function (s) {
      var p = toPx(s.x, s.y);
      ctx.fillStyle = '#21262d'; // Brighter shelf
      ctx.fillRect(p.px - 14, p.py - 12, 28, 24);
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.px - 14, p.py - 12, 28, 24);
      ctx.fillStyle = '#8b949e';
      ctx.font = '10px monospace';
      var shelfLabel = 'S' + (s.id + 1);
      if (s.items && s.items.length > 0) shelfLabel += ' ' + s.items.length + ' box';
      ctx.fillText(shelfLabel, p.px - 10, p.py + 4);

      // Inventory Indicator
      if (s.items && s.items.length > 0) {
        ctx.fillStyle = '#3fb950';
        ctx.beginPath();
        ctx.arc(p.px + 10, p.py - 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Dropped Items
    (state.dropped_items || []).forEach(function (d) {
      var dp = toPx(d.x, d.y);
      ctx.fillStyle = '#da3633'; // Red
      ctx.fillRect(dp.px - 5, dp.py - 5, 10, 10);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(dp.px - 5, dp.py - 5, 10, 10);
    });

    // Charging Station
    var cs = state.charging_station || { x: 0.5, y: 4.0 };
    var cp = toPx(cs.x, cs.y);
    ctx.fillStyle = 'rgba(76,175,80,0.3)';
    ctx.fillRect(cp.px - 25, cp.py - 20, 50, 40);
    ctx.fillStyle = '#4caf50';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('⚡', cp.px - 6, cp.py + 5);


    // Loading Bay
    var lb = state.loading_bay;
    if (lb) {
      var lp = toPx(lb.x, lb.y);
      ctx.fillStyle = 'rgba(210,153,34,0.2)';
      ctx.fillRect(lp.px - 20, lp.py - 15, 40, 30);
      ctx.fillStyle = '#d29922';
      ctx.font = '10px sans-serif';
      ctx.fillText('BAY', lp.px - 10, lp.py + 4);
    }

    // Danger zone: highlight workers when any robot has MODIFY/BLOCK (safety decision)
    var anyModifyBlock = (state.robots || []).some(function (r) {
      var d = r.last_decision && r.last_decision.decision;
      return d === 'MODIFY' || d === 'BLOCK';
    });
    (state.workers || []).forEach(function (w) {
      var wp = toPx(w.x, w.y);
      ctx.fillStyle = anyModifyBlock ? 'rgba(248,81,73,0.12)' : 'rgba(210,153,34,0.1)';
      ctx.beginPath();
      ctx.arc(wp.px, wp.py, 25, 0, Math.PI * 2);
      ctx.fill();
      if (anyModifyBlock) {
        ctx.strokeStyle = 'rgba(248,81,73,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Humans (Workers) — body
    (state.workers || []).forEach(function (w) {
      var wp = toPx(w.x, w.y);
      ctx.fillStyle = '#d29922';
      ctx.beginPath();
      ctx.arc(wp.px, wp.py, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Robots
    var cs = state.charging_station || { x: 0.5, y: 4.0 };
    var lb = state.loading_bay || { x: 11.5, y: 4.0 };
    var shelves = state.shelves || [];

    (state.robots || []).forEach(function (r) {
      var rp = toPx(r.x, r.y);

      // Line from robot to goal (where they are heading)
      if (r.goal_x != null && r.goal_y != null) {
        var gp = toPx(r.goal_x, r.goal_y);
        ctx.strokeStyle = r.id === 'r1' ? 'rgba(88,166,255,0.6)' : 'rgba(238,130,238,0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(rp.px, rp.py);
        ctx.lineTo(gp.px, gp.py);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Trace: predicted path (dashed, "if went straight") and safe path (Gate decision)
      if (r.last_decision && r.last_decision.trace) {
        var trace = r.last_decision.trace;
        if (trace.predicted_path && trace.predicted_path.length >= 2) {
          ctx.strokeStyle = 'rgba(248,81,73,0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          var pt0 = toPx(trace.predicted_path[0].x, trace.predicted_path[0].y);
          ctx.moveTo(pt0.px, pt0.py);
          for (var pi = 1; pi < trace.predicted_path.length; pi++) {
            var pt = toPx(trace.predicted_path[pi].x, trace.predicted_path[pi].y);
            ctx.lineTo(pt.px, pt.py);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (trace.safe_path && trace.safe_path.length >= 2) {
          ctx.strokeStyle = r.id === 'r1' ? 'rgba(88,166,255,0.35)' : 'rgba(238,130,238,0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          var pt = toPx(trace.safe_path[0].x, trace.safe_path[0].y);
          ctx.moveTo(pt.px, pt.py);
          for (var i = 1; i < trace.safe_path.length; i++) {
            pt = toPx(trace.safe_path[i].x, trace.safe_path[i].y);
            ctx.lineTo(pt.px, pt.py);
          }
          ctx.stroke();
        }
        if (trace.collision_at) {
          var cp = toPx(trace.collision_at.x, trace.collision_at.y);
          ctx.strokeStyle = '#f85149';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cp.px - 6, cp.py - 6);
          ctx.lineTo(cp.px + 6, cp.py + 6);
          ctx.moveTo(cp.px + 6, cp.py - 6);
          ctx.lineTo(cp.px - 6, cp.py + 6);
          ctx.stroke();
        }
      }

      // Robot Body — battery color: green >50%, yellow 15–50%, red <15%
      var bat = r.battery != null ? r.battery : 100;
      if (r.loaded) {
        ctx.fillStyle = '#d29922';
      } else if (bat < 15) {
        ctx.fillStyle = '#f85149';
      } else if (bat < 50) {
        ctx.fillStyle = '#d29922';
      } else {
        ctx.fillStyle = r.id === 'r1' ? '#58a6ff' : '#a371f7';
      }
      ctx.beginPath();
      ctx.arc(rp.px, rp.py, 12, 0, Math.PI * 2);
      ctx.fill();
      // Battery ring (segment) on robot edge
      if (bat < 100 && !r.loaded) {
        ctx.strokeStyle = bat < 15 ? '#f85149' : bat < 50 ? '#d29922' : '#3fb950';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rp.px, rp.py, 14, -Math.PI / 2, -Math.PI / 2 + (bat / 100) * Math.PI * 2);
        ctx.stroke();
      }

      // Status above robot (Idle / To S3 / To Bay / Charging / Carrying)
      var statusText = 'Idle';
      if (r.paused) statusText = 'Paused';
      else if (r.loaded) statusText = 'To Bay';
      else if (r.goal_x != null && r.goal_y != null) {
        var gx = r.goal_x; var gy = r.goal_y;
        if (Math.abs(gx - cs.x) < 0.2 && Math.abs(gy - cs.y) < 0.2) statusText = 'To charge';
        else if (lb && Math.abs(gx - lb.x) < 0.2 && Math.abs(gy - lb.y) < 0.2) statusText = 'To Bay';
        else {
          for (var si = 0; si < shelves.length; si++) {
            var s = shelves[si];
            if (Math.abs(gx - s.x) < 0.3 && Math.abs(gy - s.y) < 0.3) {
              statusText = 'To S' + (s.id + 1);
              break;
            }
          }
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(statusText, rp.px, rp.py - 18);
      ctx.textAlign = 'left';

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(r.id.toUpperCase(), rp.px - 6, rp.py - 14);

      if (r.loaded) {
        ctx.font = '14px sans-serif';
        ctx.fillText('📦', rp.px + 8, rp.py - 8);
      }
    });
  }

  // Auto-Assign Logic
  setInterval(function () {
    var chk = document.getElementById('task-auto-gen');
    if (chk && chk.checked) {
      // Check if we need tasks
      // We need latest state, but we only have it in drawWarehouse context if we saved it?
      // Let's just peer into the UI metrics or fetch fresh?
      // Fetching fresh every 2s is fine.
      // Or better: save global 'lastState'.
    }
  }, 2000);

  var lastState = null;
  var lastChatTime = 0;
  canvas.addEventListener('mousemove', function (e) {
    var tip = document.getElementById('canvas-tooltip');
    if (!tip) return;
    if (!lastState || !lastState.dropped_items || lastState.dropped_items.length === 0) {
      tip.classList.remove('visible');
      tip.textContent = '';
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var x = (e.clientX - rect.left) * scaleX;
    var y = (e.clientY - rect.top) * scaleY;
    var hovered = null;
    for (var i = 0; i < lastState.dropped_items.length; i++) {
      var d = lastState.dropped_items[i];
      var dp = toPx(d.x, d.y);
      if (x >= dp.px - 6 && x <= dp.px + 6 && y >= dp.py - 6 && y <= dp.py + 6) {
        hovered = d;
        break;
      }
    }
    if (hovered) {
      tip.textContent = (hovered.id || 'Item') + ', ' + (hovered.weight_kg != null ? hovered.weight_kg : 3) + ' kg';
      var container = canvas.parentElement;
      var crect = container ? container.getBoundingClientRect() : rect;
      tip.style.left = (e.clientX - (crect.left || rect.left) + 12) + 'px';
      tip.style.top = (e.clientY - (crect.top || rect.top) + 12) + 'px';
      tip.classList.add('visible');
    } else {
      tip.classList.remove('visible');
      tip.textContent = '';
    }
  });
  canvas.addEventListener('mouseleave', function () {
    var tip = document.getElementById('canvas-tooltip');
    if (tip) { tip.classList.remove('visible'); tip.textContent = ''; }
  });

  function updateUI(state) {
    if (!state) return;
    lastState = state;

    // Events
    var eventsList = document.getElementById('events-list');
    var banner = document.getElementById('alert-banner');
    var bannerText = document.getElementById('alert-text');

    if (eventsList) {
      eventsList.innerHTML = '';
      if (state.events && state.events.length > 0) {
        state.events.forEach(function (e) {
          var li = document.createElement('li');
          var sec = Math.round(e.time);
          li.innerHTML = '<span class="event-name">' + e.name + '</span> — ' + sec + ' s left';
          eventsList.appendChild(li);
        });

        if (banner) {
          banner.style.display = 'block';
          var first = state.events[0];
          bannerText.textContent = "⚠️ " + (first.name || '').toUpperCase() + " ACTIVE! (" + Math.round(first.time) + " s left)";
        }
      } else {
        eventsList.innerHTML = '<li class="event-empty">No active incidents</li>';
        if (banner) {
          if (state.mode === 'audit') {
            banner.style.display = 'block';
            bannerText.textContent = "🚨 AUDIT IN PROGRESS: MAINTAIN SAFETY 🚨";
          } else {
            banner.style.display = 'none';
          }
        }
      }
    }

    // Chat log per robot: R1 panel shows R1 + SYSTEM, R2 panel shows R2 + SYSTEM
    var r1Msgs = document.getElementById('chat-messages-r1');
    var r2Msgs = document.getElementById('chat-messages-r2');
    var thinkingR1 = document.getElementById('chat-thinking-r1');
    var thinkingR2 = document.getElementById('chat-thinking-r2');
    if (state.chat_messages && (r1Msgs || r2Msgs)) {
      if (state.t < lastChatTime) lastChatTime = 0;
      state.chat_messages.forEach(function (msg) {
        if (msg.time <= lastChatTime) return;
        var div = document.createElement('div');
        div.className = 'chat-msg ai ' + (msg.type || 'info');
        var icon = '🤖';
        if (msg.type === 'alert' || msg.type === 'error') icon = '⚠️';
        if (msg.type === 'success') icon = '✅';
        div.textContent = icon + ' ' + msg.sender + ': ' + msg.text;
        var sender = (msg.sender || '').toUpperCase();
        if (r1Msgs && (sender === 'R1' || sender === 'SYSTEM')) {
          var ins = thinkingR1 && thinkingR1.parentNode === r1Msgs ? thinkingR1 : null;
          if (ins) r1Msgs.insertBefore(div.cloneNode(true), ins); else r1Msgs.appendChild(div.cloneNode(true));
        }
        if (r2Msgs && (sender === 'R2' || sender === 'SYSTEM')) {
          var ins2 = thinkingR2 && thinkingR2.parentNode === r2Msgs ? thinkingR2 : null;
          if (ins2) r2Msgs.insertBefore(div.cloneNode(true), ins2); else r2Msgs.appendChild(div.cloneNode(true));
        }
        lastChatTime = msg.time;
      });
      if (r1Msgs) r1Msgs.scrollTop = r1Msgs.scrollHeight;
      if (r2Msgs) r2Msgs.scrollTop = r2Msgs.scrollHeight;
    }

    // One-line summary under canvas: R1→S5 | R2→Bay | Pool: 4 | $420
    var summaryEl = document.getElementById('canvas-summary');
    if (summaryEl && state.robots) {
      var parts = [];
      state.robots.forEach(function (r) {
        var st = 'Idle';
        if (r.paused) st = 'Paused';
        else if (r.loaded) st = '→Bay';
        else if (r.goal_x != null && r.goal_y != null) st = (r.current_task && r.current_task.shelf_id != null) ? '→S' + (r.current_task.shelf_id + 1) : '→…';
        parts.push(r.id.toUpperCase() + ' ' + st);
      });
      var poolCount = (state.task_pool && state.task_pool.length) || 0;
      parts.push('Pool: ' + poolCount);
      var money = (state.metrics && state.metrics.money !== undefined) ? state.metrics.money : 0;
      parts.push('$' + Number(money).toFixed(0));
      summaryEl.textContent = parts.join('  |  ');
    }

    // Battery drama: yellow tint when any robot < 25%
    var canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer && state.robots) {
      var minBat = 100;
      state.robots.forEach(function (r) {
        if (r.battery != null && r.battery < minBat) minBat = r.battery;
      });
      if (minBat < 25) canvasContainer.classList.add('battery-low');
      else canvasContainer.classList.remove('battery-low');
    }

    // You can help — suggestions + coordination when robots yield
    var helpEl = document.getElementById('you-can-help-content');
    if (helpEl && state.robots) {
      var tips = [];
      var yieldsCount = (state.metrics && state.metrics.yields_count) || 0;
      if (yieldsCount > 0) tips.push('Coordination: robot(s) yielded to avoid congestion.');
      state.robots.forEach(function (r) {
        var bat = r.battery != null ? r.battery : 100;
        if (bat < 25 && bat > 0) tips.push(r.id.toUpperCase() + ' battery ' + Math.round(bat) + '% — suggest Go charge');
        if (r.paused) tips.push(r.id.toUpperCase() + ' is paused — say Resume to continue');
      });
      var poolCount = (state.task_pool && state.task_pool.length) || 0;
      if (poolCount > 0) {
        var idle = state.robots.filter(function (r) {
          return !r.paused && (r.goal_x == null && r.goal_y == null) && !r.loaded;
        });
        if (idle.length > 0) tips.push('Pool has ' + poolCount + ' tasks — use Take from pool or Auto-Assign');
      }
      if (tips.length === 0) tips.push('Use quick buttons or chat: Go charge, Take from pool, Pause, Status');
      helpEl.innerHTML = tips.slice(0, 4).map(function (t) { return '<div class="help-tip">' + t + '</div>'; }).join('');
    }

    // Mission banner (top): Revenue $X/$500 | Time MM:SS/05:00 | Safety %
    var mission = state.mission || {};
    var startMoney = (state.metrics && state.metrics.starting_money != null) ? state.metrics.starting_money : 1000;
    var earned = (state.metrics && state.metrics.money != null) ? Math.max(0, state.metrics.money - startMoney) : 0;
    var goalRev = mission.goal_revenue != null ? mission.goal_revenue : 500;
    var remain = (mission.remaining_s != null) ? mission.remaining_s : 300;
    var dur = (mission.duration_s != null) ? mission.duration_s : 300;
    function fmtTime(s) {
      var m = Math.floor(s / 60);
      var sec = Math.floor(s % 60);
      return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    }
    setText('mission-revenue', '$' + Math.round(earned) + ' / $' + goalRev);
    setText('mission-time', fmtTime(remain) + ' / ' + fmtTime(dur));
    setText('mission-safety', (state.metrics && state.metrics.safety != null ? state.metrics.safety.toFixed(0) : '100') + '%');

    // Metrics
    var m = state.metrics || {};
    setText('val-money', '$' + (m.money !== undefined ? m.money.toFixed(0) : '0'));
    setText('val-safety', (m.safety !== undefined ? m.safety.toFixed(0) : (m.safety_score !== undefined ? m.safety_score.toFixed(0) : '100')) + '%');
    setBar('bar-safety', m.safety != null ? m.safety : (m.safety_score || 100));

    // Multi-Robot Battery
    (state.robots || []).forEach(function (r) {
      var bid = 'val-battery-' + r.id;
      var bbar = 'bar-battery-' + r.id;
      if (document.getElementById(bid)) {
        setText(bid, Math.round(r.battery) + '%');
        setBar(bbar, r.battery);
      }
    });

    setText('val-tasks', m.tasks_completed || 0);
    setText('val-time', Math.floor(state.t || 0));

    // Mission complete overlay
    var mcOverlay = document.getElementById('mission-complete-overlay');
    var strat = state.strategy || {};
    var tlOn = strat.trust_layer_enabled !== false;
    if (mcOverlay && mission.complete) {
      mcOverlay.style.display = 'flex';
      setText('mc-trust-layer', tlOn ? 'ON' : 'OFF (counterfactual)');
      setText('mc-violations', '0');
      setText('mc-revenue', Math.round(earned));
      setText('mc-decisions', m.decisions_evaluated != null ? m.decisions_evaluated : 0);
      setText('mc-rejected', m.plans_rejected != null ? m.plans_rejected : 0);
      setText('mc-constraints', m.constraints_triggered != null ? m.constraints_triggered : 0);
      var mwg = document.getElementById('mc-moves-without-gate-row');
      var mwgVal = document.getElementById('mc-moves-without-gate');
      if (mwg && mwgVal) {
        if (!tlOn && m.moves_without_gate != null) {
          mwg.style.display = 'block';
          mwgVal.textContent = m.moves_without_gate;
        } else {
          mwg.style.display = 'none';
        }
      }
    } else if (mcOverlay) {
      mcOverlay.style.display = 'none';
    }

    // Session goal: revenue earned toward $500
    var goalVal = (mission.goal_revenue != null) ? mission.goal_revenue : 500;
    var goalPct = Math.min(100, Math.round((earned / goalVal) * 100));
    setBar('bar-goal', goalPct);
    setText('val-goal', goalPct + '%');

    // Reasoning Log: decision + summary + candidate plans + facts per robot
    var log = document.getElementById('reasoning-log');
    if (log && state.robots) {
      var blocks = [];
      state.robots.forEach(function (r) {
        var ld = r.last_decision;
        var decision = ld && ld.decision ? ld.decision : null;
        var risk = ld && ld.risk != null ? ld.risk : null;
        var summary = ld && ld.reasoning_summary ? ld.reasoning_summary : (r.reasoning_message || "Idle");
        var line = r.id.toUpperCase() + ": " + (decision ? decision + (risk != null ? " (risk " + Number(risk).toFixed(2) + ")" : "") + " — " : "") + summary;
        blocks.push(line);
        if (ld && ld.candidate_plans && ld.candidate_plans.length) {
          var opts = ld.candidate_plans.map(function (p) {
            return p.plan_id + " cost=" + (p.score != null ? Number(p.score).toFixed(1) : "?") + (p.valid ? " valid" : " invalid") + (p.selected ? " [sel]" : "");
          }).join("; ");
          blocks.push("  Plans: " + opts);
        }
        if (ld && ld.trace && ld.trace.facts && ld.trace.facts.length) {
          var facts = ld.trace.facts.slice(0, 3).map(function (f) {
            var n = f.name || f.id || "";
            var v = f.value != null ? f.value : (f.distance != null ? f.distance : "");
            return n + "=" + v;
          }).join(", ");
          blocks.push("  Facts: " + facts);
        }
        if (ld && ld.triggered_constraints && ld.triggered_constraints.length) {
          var codes = ld.triggered_constraints.slice(0, 3).map(function (c) { return c.code || c.constraint_id || ""; }).join(", ");
          blocks.push("  Constraints: " + codes);
        }
      });
      log.textContent = blocks.join("\n");
      log.scrollTop = log.scrollHeight;
    }

    // System Efficiency stats (right of Reasoning Engine)
    var statsEl = document.getElementById('stats-content');
    if (statsEl && state.metrics) {
      var m = state.metrics;
      var money = m.money !== undefined ? m.money : 0;
      var moneyClass = money < 0 ? 'negative' : '';
      var html = '';
      html += '<div class="stat-row"><span class="stat-label">Tasks done</span><span class="stat-value">' + (m.tasks || 0) + '</span></div>';
      html += '<div class="stat-row"><span class="stat-label">Money</span><span class="stat-value ' + moneyClass + '">$' + Number(money).toFixed(0) + '</span></div>';
      html += '<div class="stat-row"><span class="stat-label">Safety</span><span class="stat-value">' + (m.safety !== undefined ? m.safety : 100) + '%</span></div>';
      html += '<div class="stat-row"><span class="stat-label">Charges</span><span class="stat-value">' + (m.charge_cycles || 0) + '</span></div>';
      html += '<div class="stat-row"><span class="stat-label">Recoveries</span><span class="stat-value">' + (m.stuck_recoveries || 0) + '</span></div>';
      html += '<div class="stat-row"><span class="stat-label">Yields</span><span class="stat-value">' + (m.yields_count || 0) + '</span></div>';
      statsEl.innerHTML = html;
    }
  }

  function sendCommand(msg, robotId) {
    if (!msg || !msg.trim()) return;

    // Determine which chat panel to use
    var chatId = robotId || 'r1'; // default to r1
    var msgs = document.getElementById('chat-messages-' + chatId);
    var thinking = document.getElementById('chat-thinking-' + chatId);

    if (!msgs) {
      console.error('Chat panel not found for robot:', chatId);
      return;
    }

    var finalMsg = msg.trim();

    var userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = 'You: ' + finalMsg;

    // Insert before thinking
    if (thinking && thinking.parentNode === msgs) {
      msgs.insertBefore(userDiv, thinking);
      thinking.style.display = 'block';
    } else {
      msgs.appendChild(userDiv);
    }
    msgs.scrollTop = msgs.scrollHeight;

    fetch('/api/game/command', {
      method: 'POST',
      headers: gameHeaders(),
      body: JSON.stringify({ message: finalMsg }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (thinking) thinking.style.display = 'none';
        saveSessionId(data);
        var aiDiv = document.createElement('div');
        aiDiv.className = 'chat-msg ai';
        aiDiv.textContent = 'AI: ' + (data.explanation || JSON.stringify(data.command));
        msgs.appendChild(aiDiv);
        msgs.scrollTop = msgs.scrollHeight;
        refreshState();
      })
      .catch(function () {
        if (thinking) thinking.style.display = 'none';
        var errDiv = document.createElement('div');
        errDiv.className = 'chat-msg ai';
        errDiv.textContent = 'System: Connection Error';
        msgs.appendChild(errDiv);
      });
  }

  // Auto-Assign (Infinite): periodically spawn pool if empty and run auto-assign
  setInterval(function () {
    var chk = document.getElementById('task-auto-gen');
    if (!chk || !chk.checked) return;
    var pool = (lastState && lastState.task_pool) ? lastState.task_pool : [];
    if (pool.length === 0) {
      spawnTaskPool();
    }
    autoAssignTasks();
  }, 4000);

  // --- Event Listeners ---

  function startNewGame() {
    var mode = document.getElementById('game-mode') && document.getElementById('game-mode').value || 'standard';
    var difficulty = (document.getElementById('game-difficulty') && document.getElementById('game-difficulty').value) || 'medium';
    var priority = (document.getElementById('game-priority') && document.getElementById('game-priority').value) || 'safety';
    var autonomy = (document.getElementById('game-autonomy') && document.getElementById('game-autonomy').value) || 'hybrid';
    var trustLayer = (document.getElementById('game-trust-layer') && document.getElementById('game-trust-layer').value) || 'on';
    var q = 'mode=' + encodeURIComponent(mode) + '&difficulty=' + encodeURIComponent(difficulty) + '&priority=' + encodeURIComponent(priority) + '&autonomy=' + encodeURIComponent(autonomy) + '&trust_layer=' + encodeURIComponent(trustLayer);
    fetch('/api/game/start?' + q, { method: 'POST', headers: gameHeaders() })
      .then(function (r) { return r.json(); })
      .then(function (s) {
        saveSessionId(s);
        var mc = document.getElementById('mission-complete-overlay');
        if (mc) mc.style.display = 'none';
        drawWarehouse(s.state);
        updateUI(s.state);
        lastChatTime = 0;
        var r1 = document.getElementById('chat-messages-r1');
        var r2 = document.getElementById('chat-messages-r2');
        if (r1) r1.innerHTML = '<div class="chat-msg ai">R1: Ready for orders.</div><div id="chat-thinking-r1" class="chat-msg thinking" style="display:none;">R1 is thinking...</div>';
        if (r2) r2.innerHTML = '<div class="chat-msg ai">R2: Ready for orders.</div><div id="chat-thinking-r2" class="chat-msg thinking" style="display:none;">R2 is thinking...</div>';
        if (s.state && s.state.task_pool) renderTaskPool(s.state.task_pool);
      });
  }

  var btnStart = document.getElementById('btn-start');
  if (btnStart) btnStart.addEventListener('click', startNewGame);

  var btnMissionClose = document.getElementById('btn-mission-close');
  if (btnMissionClose) btnMissionClose.addEventListener('click', startNewGame);

  // Strategy Apply
  var btnStrat = document.getElementById('btn-apply-strategy');
  if (btnStrat) {
    btnStrat.addEventListener('click', function () {
      var speed = parseFloat(document.getElementById('strategy-speed').value);
      var agg = document.getElementById('strategy-aggressive').checked;

      fetch('/api/game/strategy', {
        method: 'POST',
        headers: gameHeaders(),
        body: JSON.stringify({ speed_bias: speed, aggressive: agg })
      })
        .then(function (r) { return r.json(); })
        .then(function (s) {
          saveSessionId(s);
          updateUI(s.state);
        });
    });
  }

  // Chat - R1
  var btnSendR1 = document.getElementById('chat-send-r1');
  if (btnSendR1) {
    btnSendR1.addEventListener('click', function () {
      var input = document.getElementById('chat-input-r1');
      if (input.value.trim()) {
        sendCommand('R1 ' + input.value, 'r1');
        input.value = '';
      }
    });
  }
  var inputChatR1 = document.getElementById('chat-input-r1');
  if (inputChatR1) {
    inputChatR1.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && this.value.trim()) {
        sendCommand('R1 ' + this.value, 'r1');
        this.value = '';
      }
    });
  }

  // Chat - R2
  var btnSendR2 = document.getElementById('chat-send-r2');
  if (btnSendR2) {
    btnSendR2.addEventListener('click', function () {
      var input = document.getElementById('chat-input-r2');
      if (input.value.trim()) {
        sendCommand('R2 ' + input.value, 'r2');
        input.value = '';
      }
    });
  }
  var inputChatR2 = document.getElementById('chat-input-r2');
  if (inputChatR2) {
    inputChatR2.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && this.value.trim()) {
        sendCommand('R2 ' + this.value, 'r2');
        this.value = '';
      }
    });
  }

  // Quick-action buttons: send command to selected robot (Command Target)
  function getSelectedRobot() {
    var rb = document.querySelector('input[name="robot-target"]:checked');
    return rb ? rb.value : 'r1';
  }
  var quickActions = document.getElementById('quick-actions');
  if (quickActions) {
    quickActions.querySelectorAll('.btn-quick').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cmd = this.getAttribute('data-command');
        if (!cmd) return;
        var robotId = getSelectedRobot();
        var prefix = robotId.toUpperCase();
        sendCommand(prefix + ' ' + cmd, robotId);
      });
    });
  }

  // Example commands (demo: judge can try without typing)
  document.querySelectorAll('.btn-example').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cmd = this.getAttribute('data-cmd');
      if (!cmd) return;
      var robotId = getSelectedRobot();
      if (cmd.toUpperCase().startsWith('R1 ') || cmd.toUpperCase().startsWith('R2 ')) {
        robotId = cmd.toLowerCase().slice(0, 2);
        sendCommand(cmd, robotId);
      } else {
        sendCommand(robotId.toUpperCase() + ' ' + cmd, robotId);
      }
    });
  });

  // Help Modal
  var btnHelp = document.getElementById('btn-help');
  var modal = document.getElementById('help-modal');
  var btnClose = document.getElementById('btn-close-help');

  if (btnHelp && modal) {
    btnHelp.addEventListener('click', function () {
      modal.showModal();
    });
  }
  if (btnClose && modal) {
    btnClose.addEventListener('click', function () {
      modal.close();
    });
  }
  window.refreshState = function () {
    fetch('/api/game/state', { headers: gameHeaders(false) })
      .then(function (r) { return r.json(); })
      .then(function (s) {
        saveSessionId(s);
        if (s.error) {
          console.error("State Error:", s.error);
          if (s.state) s = s.state;
          else return;
        }
        drawWarehouse(s);
        updateUI(s);
        updateTaskPoolFromState(s);
      })
      .catch(function (e) { console.error(e); });
  }

  window.tick = function () {
    fetch('/api/game/tick', { method: 'POST', headers: gameHeaders(), body: '{}' })
      .then(function (r) { return r.json(); })
      .then(function (s) {
        saveSessionId(s);
        if (s.error) {
          console.error("Tick Error:", s.error);
          if (s.state) s = s.state;
          else return;
        }
        drawWarehouse(s);
        updateUI(s);
        updateTaskPoolFromState(s);
      })
      .catch(function () { });
  }

  // Init
  window.refreshState();
  setInterval(window.tick, 250);
})();

// ============================================================================
// TASK POOL FUNCTIONALITY
// ============================================================================

function renderTaskPool(tasks) {
  var list = document.getElementById('task-pool-list');
  var count = document.getElementById('task-pool-count');

  if (!list || !count) return;

  count.textContent = tasks.length;

  if (tasks.length === 0) {
    list.innerHTML = '<div class="task-pool-empty">No tasks in pool</div>';
    return;
  }

  list.innerHTML = '';

  tasks.forEach(function (task) {
    var div = document.createElement('div');
    div.className = 'task-item task-' + task.priority;
    if (task.status === 'assigned') {
      div.classList.add('task-assigned');
    }

    var w = task.weight_kg != null ? task.weight_kg : 3;
    var val = task.value != null ? task.value : (w * 10);
    div.innerHTML =
      '<span class="task-id">' + task.id + '</span>' +
      '<span class="task-desc">' + task.item + ' ' + w + 'kg: S' + (task.from_shelf + 1) + '→Bay</span>' +
      '<span class="task-priority ' + task.priority + '">' + task.priority + '</span>' +
      '<span class="task-value">$' + Math.round(val) + '</span>' +
      (task.status === 'assigned' ? '<span class="task-status assigned">' + (task.assigned_to || '').toUpperCase() + '</span>' : '');

    list.appendChild(div);
  });

  // renderTaskPool already updates the UI
}

function spawnTaskPool() {
  var gameHeaders = window.gameHeaders || function () { return {}; };
  var saveSessionId = window.saveSessionId || function () { };
  fetch('/api/game/task-pool/spawn?count=6', { method: 'POST', headers: gameHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      saveSessionId(data);
      if (data.status === 'ok') {
        renderTaskPool(data.tasks);
      }
    })
    .catch(function (err) {
      console.error('Failed to spawn task pool:', err);
    });
}

function autoAssignTasks() {
  var gameHeaders = window.gameHeaders || function () { return {}; };
  var saveSessionId = window.saveSessionId || function () { };
  fetch('/api/game/task-pool/auto-assign', { method: 'POST', headers: gameHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      saveSessionId(data);
      if (data.status === 'ok') {
        console.log('Tasks auto-assigned:', data.assignments);
        refreshState();
      }
    })
    .catch(function (err) {
      console.error('Failed to auto-assign tasks:', err);
    });
}

// Update task pool from state
function updateTaskPoolFromState(state) {
  if (state.task_pool) {
    renderTaskPool(state.task_pool);
  }
}

// Add event listeners for task pool buttons
document.addEventListener('DOMContentLoaded', function () {
  var btnSpawn = document.getElementById('btn-spawn-tasks');
  var btnAutoAssign = document.getElementById('btn-auto-assign');

  if (btnSpawn) {
    btnSpawn.addEventListener('click', spawnTaskPool);
  }

  if (btnAutoAssign) {
    btnAutoAssign.addEventListener('click', autoAssignTasks);
  }

  // Setup config modal
  setupConfigModal();
});

// ============================================================================
// CONFIGURATION MODAL SETUP
// ============================================================================

function setupConfigModal() {
  var modal = document.getElementById('config-modal');
  var btnSave = document.getElementById('btn-save-config');
  var btnCancel = document.getElementById('btn-cancel-config');
  var btnConfig = document.getElementById('btn-config');
  var providerSelect = document.getElementById('llm-provider');
  var statusEl = document.getElementById('config-status');

  if (!modal) return;

  // Update help text when provider changes
  if (providerSelect) {
    providerSelect.addEventListener('change', function () {
      var provider = this.value;
      document.getElementById('llm-help-gemini').style.display = provider === 'gemini' ? 'inline' : 'none';
      document.getElementById('llm-help-openai').style.display = provider === 'openai' ? 'inline' : 'none';
      var llmInput = document.getElementById('llm-api-key');
      if (llmInput) {
        llmInput.placeholder = CONFIG.PROVIDERS[provider].keyPlaceholder;
      }
    });
  }

  // Load existing config
  function loadConfigToModal() {
    var llmKey = getLlmApiKey();
    var llmProvider = getLlmProvider();

    if (document.getElementById('llm-api-key')) {
      document.getElementById('llm-api-key').value = llmKey;
    }
    if (document.getElementById('llm-provider')) {
      document.getElementById('llm-provider').value = llmProvider;
      // Trigger change event to update help text
      if (providerSelect) {
        providerSelect.dispatchEvent(new Event('change'));
      }
    }
  }

  // Save config
  if (btnSave) {
    btnSave.addEventListener('click', function () {
      var llmKey = document.getElementById('llm-api-key').value.trim();
      var llmProvider = document.getElementById('llm-provider').value;

      if (!llmKey) {
        statusEl.textContent = '❌ Please enter LLM API key';
        statusEl.style.color = '#f85149';
        return;
      }

      if (saveConfig(llmKey, llmProvider)) {
        statusEl.textContent = '✅ Configuration saved!';
        statusEl.style.color = '#3fb950';
        setTimeout(function () {
          modal.close();
          statusEl.textContent = '';
          // Refresh the page to start with new config
          window.location.reload();
        }, 1000);
      } else {
        statusEl.textContent = '❌ Failed to save configuration';
        statusEl.style.color = '#f85149';
      }
    });
  }

  // Cancel
  if (btnCancel) {
    btnCancel.addEventListener('click', function () {
      if (isConfigured()) {
        modal.close();
        statusEl.textContent = '';
      } else {
        statusEl.textContent = '⚠️ You must configure API keys to play';
        statusEl.style.color = '#d29922';
      }
    });
  }

  // Config button in header
  if (btnConfig) {
    btnConfig.addEventListener('click', function () {
      loadConfigToModal();
      modal.showModal();
    });
  }

  // Load config when modal opens
  modal.addEventListener('show', loadConfigToModal);
}

// ============================================================================
// API URL WRAPPER - Prepend production API URL to all /api/* calls
// ============================================================================

(function () {
  var originalFetch = window.fetch;
  window.fetch = function (url, options) {
    // Only prepend if URL starts with /api
    if (typeof url === 'string' && url.startsWith('/api')) {
      url = CONFIG.API_URL + url;
    }
    return originalFetch(url, options);
  };
})();
