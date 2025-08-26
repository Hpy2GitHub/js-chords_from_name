    <script>
        // Constants for guitar tuning and notes
        const MAX_STRINGS = 6;
        const DEFAULT_TUNING = [4, 9, 2, 7, 11, 4]; // E A D G B E
        const NOTE_MAP = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const FINGER_MAP = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 4 };

        // Enhanced Guitar Fret Labeler from main.js
        class GuitarFretLabeler {
            calculateFretLabeling(chordData) {
                const chord = chordData;
                const placementFret = chord.placement_fret;

                let rootMark = null;
                for (let mark of chord.intervals_marks) {
                    if (mark[2].trim() === 'R') {
                        rootMark = { string: mark[0], fretOffset: mark[1], interval: 'R' };
                        break;
                    }
                }
                
                const diagramRange = this.calculateDiagramRange(chord, placementFret);
                const labelPosition = this.calculateLabelPosition(chord, placementFret, diagramRange);

                return {
                    rootFretNumber: placementFret,
                    labelFret: placementFret.toString(),
                    diagramStartFret: diagramRange.startFret,
                    diagramEndFret: diagramRange.endFret,
                    shouldShowOpenStrings: diagramRange.startFret === 0,
                    labelPosition
                };
            }
            
            calculateDiagramRange(chord, rootFretNumber) {
                const diagramLength = 5;
                if (rootFretNumber <= 3) {
                    return { startFret: 0, endFret: diagramLength - 1 };
                }
                const startFret = Math.max(1, rootFretNumber - 2);
                return { startFret, endFret: startFret + diagramLength - 1 };
            }
            
            calculateLabelPosition(chord, rootFretNumber, diagramRange) {
                const positionInDiagram = rootFretNumber - diagramRange.startFret;
                return {
                    diagramRow: positionInDiagram + 1,
                    fretNumber: rootFretNumber,
                    displayText: rootFretNumber.toString().padStart(2, '0')
                };
            }
            
            labelChordFrets(jsonData) {
                const result = this.calculateFretLabeling(jsonData);
                result.displayLabel = result.labelFret.padEnd(3, ' ');
                result.isOpenChord = result.shouldShowOpenStrings;
                return result;
            }
        }

        // Enhanced SVG Renderer from main.js
        class GuitarSVGRenderer {
            constructor() {
                this.svgNS = "http://www.w3.org/2000/svg";
                this.defaultConfig = {
                    width: 350,
                    stringCount: 6,
                    stringSpacing: 40,
                    fretSpacing: 30,
                    margin: 20,
                    circleRadius: 10,
                    fontSize: {
                        fretNumber: 12,
                        chordLabel: 10,
                        title: 12,
                        debugInfo: 9
                    },
                    colors: {
                        fretLine: "black",
                        stringLine: "black",
                        rootNote: "#00ff00",
                        normalNote: "#000000",
                        rootText: "#000000",
                        normalText: "#ffffff",
                        debugText: "#666666"
                    }
                };
            }

            createChordSVG(marks, title, placementFret, formLength, templateId, diagramType, chordIndex, labelingInfo = null) {
                const cfg = this.defaultConfig;
                const svg = document.createElementNS(this.svgNS, "svg");

                const fretCount = formLength + 1;
                const topPadding = 30;
                const circlePadding = cfg.circleRadius;
                const baseHeight = cfg.margin * 2 + (fretCount * cfg.fretSpacing);
                const titleHeight = 30;
                const debugHeight = document.getElementById('debugToggle').checked ? 50 : 0;
                const totalHeight = topPadding + circlePadding + baseHeight + titleHeight + debugHeight;

                svg.setAttribute("width", cfg.width);
                svg.setAttribute("height", totalHeight);

                this.drawFrets(svg, cfg, fretCount, placementFret, labelingInfo, topPadding + circlePadding);
                this.drawStrings(svg, cfg, fretCount, topPadding + circlePadding);
                this.drawMarks(svg, cfg, marks, title, diagramType, topPadding + circlePadding);
                this.drawTitle(svg, cfg, chordIndex, templateId, diagramType, placementFret, fretCount, topPadding + circlePadding);

                if (document.getElementById('debugToggle').checked) {
                    this.drawDebugInfo(svg, cfg, marks, placementFret, fretCount, topPadding + circlePadding);
                }

                return svg;
            }

            drawFrets(svg, cfg, fretCount, fretStart, labelingInfo, topPadding = 0) {
                for (let i = 0; i <= fretCount; i++) {
                    const y = topPadding + cfg.margin + i * cfg.fretSpacing;
                    const line = document.createElementNS(this.svgNS, "line");
                    line.setAttribute("x1", cfg.margin);
                    line.setAttribute("x2", cfg.margin + (cfg.stringCount - 1) * cfg.stringSpacing);
                    line.setAttribute("y1", y);
                    line.setAttribute("y2", y);
                    line.setAttribute("stroke", cfg.colors.fretLine);
                    line.setAttribute("stroke-width", "2");
                    svg.appendChild(line);

                    this.drawFretLabel(svg, cfg, i, y, fretStart, labelingInfo);
                }
            }

            drawFretLabel(svg, cfg, fretIndex, yPos, fretStart, labelingInfo) {
                if (labelingInfo && !labelingInfo.isOpenChord) {
                    if (fretIndex === labelingInfo.labelPosition.diagramRow - 1) {
                        const text = document.createElementNS(this.svgNS, "text");
                        text.setAttribute("x", cfg.margin - 20);
                        text.setAttribute("y", yPos + 15);
                        text.setAttribute("font-size", cfg.fontSize.fretNumber);
                        text.textContent = labelingInfo.labelFret;
                        svg.appendChild(text);
                    }
                } else if (fretIndex === 0 && fretStart > 0 && !labelingInfo) {
                    const text = document.createElementNS(this.svgNS, "text");
                    text.setAttribute("x", cfg.margin - 20);
                    text.setAttribute("y", cfg.margin + 15);
                    text.setAttribute("font-size", cfg.fontSize.fretNumber);
                    text.textContent = fretStart.toString().padEnd(3, ' ');
                    svg.appendChild(text);
                }
            }

            drawStrings(svg, cfg, fretCount, topPadding = 0) {
                for (let i = 0; i < cfg.stringCount; i++) {
                    const x = cfg.margin + i * cfg.stringSpacing;
                    const line = document.createElementNS(this.svgNS, "line");
                    line.setAttribute("x1", x);
                    line.setAttribute("x2", x);
                    line.setAttribute("y1", topPadding + cfg.margin);
                    line.setAttribute("y2", topPadding + cfg.margin + fretCount * cfg.fretSpacing);
                    line.setAttribute("stroke", cfg.colors.stringLine);
                    line.setAttribute("stroke-width", "1");
                    svg.appendChild(line);
                }
            }

            drawMarks(svg, cfg, marks, title, diagramType, topPadding = 0) {
                if (!Array.isArray(marks)) {
                    console.error('Invalid marks array:', marks);
                    return;
                }
                marks.forEach(([string, fret, olabel]) => {
                    const label = olabel.trim();
                    if (!Number.isInteger(string) || !Number.isInteger(fret) || typeof label !== 'string') return;
                    this.drawSingleMark(svg, cfg, string, fret, label, title, topPadding);
                });
            }

            drawSingleMark(svg, cfg, string, fret, label, title, topPadding = 0) {
                const normalizedLabel = label.toLowerCase().trim();
                const openStringLabels = ["0", "o", "open"];

                if (fret === 0 && (normalizedLabel === "x" || (openStringLabels.includes(normalizedLabel) && title.includes("Fingerings")))) {
                    this.drawOpenStringMark(svg, cfg, string, normalizedLabel, title, topPadding);
                } else {
                    this.drawFrettedMark(svg, cfg, string, fret, label, title, topPadding);
                }
            }

            drawOpenStringMark(svg, cfg, string, normalizedLabel, title, topPadding = 0) {
                const text = document.createElementNS(this.svgNS, "text");
                text.setAttribute("x", cfg.margin + (string - 1) * cfg.stringSpacing);
                text.setAttribute("y", topPadding + cfg.margin - 5);
                text.setAttribute("font-size", cfg.fontSize.fretNumber);
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("fill", "#000000");
                text.textContent = normalizedLabel === "x" ? "x" : "o";
                svg.appendChild(text);
            }

            drawFrettedMark(svg, cfg, string, fret, label, title, topPadding = 0) {
                const x = cfg.margin + (string - 1) * cfg.stringSpacing;
                const y = topPadding + cfg.margin + fret * cfg.fretSpacing - cfg.fretSpacing / 2;
                const isRoot = label.toLowerCase() === "r";
                const circle = document.createElementNS(this.svgNS, "circle");
                circle.setAttribute("cx", x);
                circle.setAttribute("cy", y);
                circle.setAttribute("r", cfg.circleRadius);
                circle.setAttribute("fill", isRoot ? cfg.colors.rootNote : cfg.colors.normalNote);
                svg.appendChild(circle);

                const text = document.createElementNS(this.svgNS, "text");
                text.setAttribute("x", x);
                text.setAttribute("y", y + 3);
                text.setAttribute("font-size", cfg.fontSize.chordLabel);
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("fill", isRoot ? cfg.colors.rootText : cfg.colors.normalText);
                text.textContent = label;
                svg.appendChild(text);
            }

            drawTitle(svg, cfg, chordIndex, templateId, diagramType, placementFret, fretCount, topPadding = 0) {
                const titleText = document.createElementNS(this.svgNS, "text");
                titleText.setAttribute("x", cfg.margin);
                titleText.setAttribute("y", topPadding + cfg.margin + fretCount * cfg.fretSpacing + 25);
                titleText.setAttribute("font-size", cfg.fontSize.title);
                titleText.textContent = `${chordIndex + 1} / ${templateId} / ${diagramType}`;
                svg.appendChild(titleText);
            }

            drawDebugInfo(svg, cfg, marks, placementFret, fretCount, topPadding = 0) {
                const debugGroup = document.createElementNS(this.svgNS, "g");
                const fretText = document.createElementNS(this.svgNS, "text");
                fretText.setAttribute("x", cfg.margin);
                fretText.setAttribute("y", topPadding + cfg.margin + fretCount * cfg.fretSpacing + 40);
                fretText.setAttribute("font-size", cfg.fontSize.debugInfo);
                fretText.setAttribute("fill", cfg.colors.debugText);
                fretText.textContent = `Fret: ${placementFret}`;
                debugGroup.appendChild(fretText);

                const marksText = document.createElementNS(this.svgNS, "text");
                marksText.setAttribute("x", cfg.margin);
                marksText.setAttribute("y", topPadding + cfg.margin + fretCount * cfg.fretSpacing + 55);
                marksText.setAttribute("font-size", cfg.fontSize.debugInfo);
                marksText.setAttribute("fill", cfg.colors.debugText);
                const formattedMarks = marks.map(m => `(${m[0]},${m[1]},'${m[2]}')`).join(', ');
                marksText.textContent = `Marks: [${formattedMarks}]`;
                debugGroup.appendChild(marksText);

                svg.appendChild(debugGroup);
            }
        }

        const fretLabeler = new GuitarFretLabeler();
        const svgRenderer = new GuitarSVGRenderer();

        // Utility functions
        function calculateInterval(root, note) {
            const intervals = ['R', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7'];
            const diff = (note - root + 12) % 12;
            return intervals[diff];
        }

        function parseChordInput(input) {
            const notes = input.split(/\s+/).map(note => NOTE_MAP[note.trim()]);
            const validNotes = notes.filter(note => note !== undefined);
            return [validNotes, validNotes.length];
        }

        function parseFingering(fingering, firstFret, rootNoteStr) {
            const marks = [];
            const notes = [];
            const intervals = [];

            const rootNoteNum = NOTE_MAP[rootNoteStr];

            for (let i = 0; i < fingering.length; i++) {
                const fret = fingering[i];
                if (fret === -1) {
                    marks.push([i + 1, 0, 'x']);
                } else if (fret === 0) {
                    const noteNum = DEFAULT_TUNING[i];
                    const noteName = NOTE_NAMES[noteNum];
                    const interval = calculateInterval(rootNoteNum, noteNum);
                    marks.push([i + 1, 0, 'o']);
                    notes.push([i + 1, 0, noteName]);
                    intervals.push([i + 1, 0, interval]);
                } else {
                    const displayFret = fret - firstFret + 1;
                    const noteNum = (DEFAULT_TUNING[i] + fret) % 12;
                    const noteName = NOTE_NAMES[noteNum];
                    const interval = calculateInterval(rootNoteNum, noteNum);

                    marks.push([i + 1, displayFret, FINGER_MAP[i + 1].toString()]);
                    notes.push([i + 1, displayFret, noteName]);
                    intervals.push([i + 1, displayFret, interval]);
                }
            }

            return {
                finger_marks: marks,
                notes_marks: notes,
                intervals_marks: intervals,
                placement_fret: firstFret,
                template: {
                    form_length: parseInt(document.getElementById('fretRange').value),
                    id: 'Generated'
                }
            };
        }

        // Chord generation presets
        const chordPresets = {
            'E_maj': { notes: 'E G# B', root: 'E', firstFret: 0 },
            'A_min': { notes: 'A C E', root: 'A', firstFret: 0 },
            'C_maj': { notes: 'C E G', root: 'C', firstFret: 3 },
            'G_dom7': { notes: 'G B D F', root: 'G', firstFret: 3 },
            'D_min7': { notes: 'D F A C', root: 'D', firstFret: 5 }
        };

        function loadPreset(root, type) {
            const presetKey = `${root}_${type}`;
            const preset = chordPresets[presetKey];
            
            if (preset) {
                document.getElementById('chordInput').value = preset.notes;
                document.getElementById('rootNote').value = preset.root;
                document.getElementById('firstFret').value = preset.firstFret;
                generateChord();
            } else {
                // Generate basic chord structure for unknown presets
                const chordTones = {
                    'maj': [0, 4, 7],
                    'min': [0, 3, 7],
                    'dom7': [0, 4, 7, 10],
                    'maj7': [0, 4, 7, 11],
                    'min7': [0, 3, 7, 10]
                };
                
                const rootNum = NOTE_MAP[root];
                const intervals = chordTones[type] || [0, 4, 7];
                const notes = intervals.map(interval => NOTE_NAMES[(rootNum + interval) % 12]).join(' ');
                
                document.getElementById('chordInput').value = notes;
                document.getElementById('rootNote').value = root;
                generateChord();
            }
        }

        function generateChord() {
            const chordInput = document.getElementById('chordInput').value;
            const outputContainer = document.getElementById('output');

            if (!chordInput.trim()) {
                outputContainer.innerHTML = '<p class="error-message">Please enter at least one note.</p>';
                return;
            }

            const firstFret = parseInt(document.getElementById('firstFret').value);
            const fretRange = parseInt(document.getElementById('fretRange').value);
            const rootNoteStr = document.getElementById('rootNote').value || chordInput.split(/\s+/)[0];

            // Generate a more realistic fingering pattern
            const chordNotes = parseChordInput(chordInput)[0];
            const mockFingering = generateFingeringPattern(chordNotes, firstFret, rootNoteStr);

            const chordData = parseFingering(mockFingering, firstFret, rootNoteStr);
            const labelingInfo = fretLabeler.labelChordFrets(chordData);

            outputContainer.innerHTML = '';

            const diagramsContainer = document.createElement('div');
            diagramsContainer.className = 'chord-diagrams';

            const types = [
                { marks: chordData.finger_marks, type: 'Fingerings' },
                { marks: chordData.notes_marks, type: 'Notes' },
                { marks: chordData.intervals_marks, type: 'Intervals' }
            ];

            types.forEach((diagram, index) => {
                const div = document.createElement('div');
                div.className = 'chord-diagram';

                const svg = svgRenderer.createChordSVG(
                    diagram.marks,
                    `${diagram.type} for Generated`,
                    chordData.placement_fret,
                    chordData.template.form_length,
                    chordData.template.id,
                    diagram.type,
                    index,
                    labelingInfo
                );

                div.appendChild(svg);
                diagramsContainer.appendChild(div);
            });

            outputContainer.appendChild(diagramsContainer);
        }

        function generateFingeringPattern(chordNotes, firstFret, rootNoteStr) {
            // Generate a more realistic fingering based on chord notes
            const pattern = [];
            const rootNote = NOTE_MAP[rootNoteStr];
            
            for (let string = 0; string < 6; string++) {
                const openNote = DEFAULT_TUNING[string];
                
                // Check if open string contains a chord tone
                if (chordNotes.includes(openNote)) {
                    pattern.push(0); // Open string
                } else {
                    // Find the closest chord tone within fret range
                    let bestFret = firstFret;
                    let found = false;
                    
                    for (let fret = firstFret; fret <= firstFret + 4; fret++) {
                        const noteAtFret = (openNote + fret) % 12;
                        if (chordNotes.includes(noteAtFret)) {
                            bestFret = fret;
                            found = true;
                            break;
                        }
                    }
                    
                    if (found) {
                        pattern.push(bestFret);
                    } else {
                        pattern.push(-1); // Muted string
                    }
                }
            }
            
            return pattern;
        }

        function clearAll() {
            document.getElementById('chordInput').value = '';
            document.getElementById('rootNote').value = '';
            document.getElementById('firstFret').value = '1';
            document.getElementById('fretRange').value = '4';
            document.getElementById('output').innerHTML = '';
        }

        function initializeApp() {
            document.getElementById('generateBtn').addEventListener('click', generateChord);
            document.getElementById('clearBtn').addEventListener('click', clearAll);
            
            // Load default chord on startup
            loadPreset('E', 'maj');
        }

        document.addEventListener('DOMContentLoaded', initializeApp);
    </script>
