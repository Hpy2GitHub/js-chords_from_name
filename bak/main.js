/** 
 * Guitar Fret Labeler with improved fret numbering
 */
class GuitarFretLabeler {
    
    calculateFretLabeling(chordData) {
        const chord = chordData.chords[0];
        const placementFret = chord.placement_fret;

        const rootMark = this.findRootNoteMark(chord);
        const rootFretNumber = placementFret;
        const rootFretDisplay = placementFret.toString().padEnd(3, ' '); // 2 digits + space

        const diagramRange = this.calculateDiagramRange(chord, rootFretNumber);
        const labelPosition = this.calculateLabelPosition(chord, rootFretNumber, diagramRange);

        return {
            rootFretNumber,
            labelFret: rootFretDisplay,
            diagramStartFret: diagramRange.startFret,
            diagramEndFret: diagramRange.endFret,
            shouldShowOpenStrings: diagramRange.startFret === 0,
            labelPosition
        };
    }
    
    findRootNoteMark(chord) {
        for (let mark of chord.intervals_marks) {
            const [string, fret, interval] = mark;
            if (interval.trim() === 'R') {
                return { string, fretOffset: fret, interval };
            }
        }
        const rootMark = chord.finger_marks.find(mark => mark[0] === chord.template.root_string);
        if (rootMark) {
            return { string: rootMark[0], fretOffset: rootMark[1], interval: 'R' };
        }
        return null;
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
    
    formatFretLabel(fretNumber) {
        return fretNumber.toString().padEnd(3, ' ');
    }
    
    labelChordFrets(jsonData) {
        const result = this.calculateFretLabeling(jsonData);
        result.displayLabel = this.formatFretLabel(result.labelFret);
        result.isOpenChord = result.shouldShowOpenStrings;
        return result;
    }
}

/** 
 * Guitar SVG Renderer with dynamic sizing and debug info
 */
class GuitarSVGRenderer {
    
    constructor() {
        this.svgNS = "http://www.w3.org/2000/svg";
        this.defaultConfig = {
            width: 350, // Increased from 200 to 350
            stringCount: 6,
            stringSpacing: 40, // Increased from 30 to 40
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

// Main Application
const fretLabeler = new GuitarFretLabeler();
const svgRenderer = new GuitarSVGRenderer();

// UI Functions
function updateChordName() {
    const root = document.getElementById('rootNote').value;
    const chordType = document.getElementById('chordType').value;
    const chordName = document.getElementById('chordName');
    const chordTypeDisplay = {
        'maj': 'Major',
        'min': 'Minor',
        'dom7': '7',
        'maj7': 'Maj7',
        'min7': 'm7',
        'dim': 'dim',
        'aug': 'aug'
    };
    chordName.value = `${root}${chordTypeDisplay[chordType] || chordType}`;
}

async function fetchChordData(root, chordType, startFret, endFret) {
    const apiUrl = `http://localhost/cgi-bin/cd/chordgui/chordgui.py?root=${encodeURIComponent(root)}&type=${encodeURIComponent(chordType)}&start_fret=${startFret}&end_fret=${endFret}`;
    try {
        const response = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        const data = await response.json();
        if (!data.chords) throw new Error('Invalid response: missing chords array');
        return { data, apiUrl };
    } catch (error) {
        console.error('Error fetching chord data:', error);
        document.getElementById('debugOutput').textContent = `Error: ${error.message}`;
        return null;
    }
}

async function generateChords() {
    const root = document.getElementById('rootNote').value;
    const chordType = document.getElementById('chordType').value;
    const startFret = parseInt(document.getElementById('startFret').value) || 0;
    const endFret = parseInt(document.getElementById('endFret').value) || 17;

    document.getElementById('chordDisplay').innerHTML = '<p>Loading...</p>';
    
    try {
        const result = await fetchChordData(root, chordType, startFret, endFret);
        if (result && result.data) {
            displayChords(result.data);
            document.getElementById('debugOutput').textContent = JSON.stringify(result.data, null, 2);
        }
    } catch (error) {
        document.getElementById('chordDisplay').innerHTML = '<p class="error">Failed to load chord data</p>';
        document.getElementById('debugOutput').textContent = `Error: ${error.message}`;
    }
}

function displayChords(data) {
    const chordDisplay = document.getElementById('chordDisplay');
    chordDisplay.innerHTML = '';

    if (!data.chords) {
        chordDisplay.innerHTML = '<p class="error">No chords returned</p>';
        return;
    }

    data.chords.forEach((chord, index) => {
        const labelingInfo = fretLabeler.labelChordFrets({ chords: [chord] });
        const templateId = chord.template?.id || `Unknown-${index + 1}`;
        
        const row = document.createElement('div');
        row.className = 'chord-row';
        
        [
            { marks: chord.finger_marks, type: 'Fingerings' },
            { marks: chord.notes_marks, type: 'Notes' },
            { marks: chord.intervals_marks, type: 'Intervals' }
        ].forEach(diagram => {
            const div = document.createElement('div');
            div.className = 'chord-diagram';
            
            const svg = svgRenderer.createChordSVG(
                diagram.marks,
                `${diagram.type} for ${templateId}`,
                chord.placement_fret,
                chord.template.form_length,
                templateId,
                diagram.type,
                index,
                labelingInfo
            );
            
            div.appendChild(svg);
            row.appendChild(div);
        });
        
        chordDisplay.appendChild(row);
    });
}

try {
// Test Data and Initialization
const testData = {
    "chords": [{
        "template": {
            "id": "X-5",
            "marks": [[1,0,"0"],[2,2,"2"],[3,2,"2"],[4,1,"1"],[5,0,"0"],[6,0,"0"]],
            "root_string": 1,
            "form_length": 2
        },
        "placement_fret": 0,
        "finger_marks": [[1,0,"0"],[2,2,"2"],[3,2,"2"],[4,1,"1"],[5,0,"0"],[6,0,"0"]],
        "notes_marks": [[1,0,"E"],[2,2,"B"],[3,2,"G#"],[4,1,"E"],[5,0,"B"],[6,0,"E"]],
        "intervals_marks": [[1,0,"R"],[2,2,"5"],[3,2,"3"],[4,1,"R"],[5,0,"5"],[6,0,"R"]]
    }],
    "request": {
        "root": "E",
        "chord_type": "maj",
        "start_fret": 0,
        "end_fret": 17
    }
};

function useTestData() {
    if (testData.request) {
        document.getElementById('rootNote').value = testData.request.root;
        document.getElementById('chordType').value = testData.request.chord_type;
        document.getElementById('startFret').value = testData.request.start_fret;
        document.getElementById('endFret').value = testData.request.end_fret;
        updateChordName();
    }
    displayChords(testData);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('rootNote').addEventListener('change', updateChordName);
    document.getElementById('chordType').addEventListener('change', updateChordName);
    document.getElementById('debugToggle').addEventListener('change', function() {
        document.querySelector('.debug-section').style.display = this.checked ? 'block' : 'none';
        if (this.checked) useTestData();
    });
    
    updateChordName();
    useTestData();
});
} catch (e) {
    console.error("Initialization error:", e);
    document.body.innerHTML = `<div style="color:red;padding:20px;">
        <h2>Error loading application</h2>
        <p>${e.message}</p>
        <p>Check console for details</p>
    </div>`;
}