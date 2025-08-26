  (function () {
    // Adjust selectors if your form uses different class/ID names
    const form = document.querySelector('.notes-two-row-form, .inline-notes-form');
    const noteButtons = Array.from(form.querySelectorAll('.note-btn'));
    const notesOutput = form.querySelector('#notesReadOnly, .notes-output');

    // Ordered unique selection
    const selected = [];

    function updateOutput() {
      // Space-separated, ordered list (e.g., "C E G")
      notesOutput.value = selected.join(' ');
    }

    function toggleNote(note, btn) {
      const i = selected.indexOf(note);
      if (i === -1) {
        selected.push(note);
        btn.classList.add('active'); // stays solid blue via CSS
      } else {
        selected.splice(i, 1);
        btn.classList.remove('active');
      }
      updateOutput();
    }

    // Wire up click handlers for note buttons
    noteButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        toggleNote(btn.dataset.note, btn);
      });
    });

    // Reset behavior (clears selection and visuals)
    form.addEventListener('reset', () => {
      // Allow native inputs to reset first
      setTimeout(() => {
        selected.splice(0, selected.length);
        noteButtons.forEach((b) => b.classList.remove('active'));
        updateOutput();
      }, 0);
    });

    // Optional: block submit if no notes selected
    form.addEventListener('submit', (e) => {
      if (!notesOutput.value.trim()) {
        e.preventDefault();
        // Optionally show an inline message or toast here
      }
    });

    // Initialize field (important if the page preserves state)
    updateOutput();
  })();
