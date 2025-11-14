/**
 * Improved Smart Anti-Snoring Pillow System Frontend
 * Version 2.0 - Fixed syntax errors and improved error handling
 */

class SnorePillowSystem {
    constructor() {
        // DOM Elements Cache
        this.elements = this.cacheElements();
        
        // State Management
        this.state = {
            isRecording: false,
            isPillowActionActive: false,
            autoDetectEnabled: false,
            detectionDelay: 5,
            systemStatus: {
                model_loaded: false,
                gpio_ready: false,
                connection: true,
                pump_active: false
            },
            logPaused: false,
            visualizerActive: true
        };
        
        // API Configuration
        this.api = {
            baseUrl: '',
            timeout: 10000,
            retryAttempts: 3,
            retryDelay: 1000
        };
        
        // Chart Instance
        this.chart = null;
        this.visualizerAnimation = null;
        this.currentAudio = null;
        
        // Timers and Intervals
        this.intervals = {
            status: null,
            history: null,
            logs: null,
            time: null,
            visualizer: null
        };
        
        // Error tracking
        this.errorCount = 0;
        this.maxErrors = 5;
        
        this.init();
    }
    
    /**
     * Cache DOM elements for better performance
     */
    cacheElements() {
        const elements = {};
        const selectors = {
            // Status elements
            recordingStatus: '#recording-status',
            detectionResult: '#detection-result',
            pumpStatus: '#pump-status',
            systemStatus: '#system-status',
            
            // Indicators
            recordingIndicator: '#recording-indicator',
            pumpIndicator: '#pump-indicator',
            modelIndicator: '#model-indicator',
            gpioIndicator: '#gpio-indicator',
            connectionIndicator: '#connection-indicator',
            confidenceFill: '#confidence-fill',
            
            // Controls
            autoDetectToggle: '#auto-detect-toggle',
            autoDetectStatus: '#auto-detect-status',
            delaySlider: '#delay-slider',
            delayValue: '#delay-value',
            manualRecordBtn: '#manual-record-btn',
            
            // Pillow controls
            level1Btn: '#level-1-btn',
            level2Btn: '#level-2-btn',
            level3Btn: '#level-3-btn',
            deflateBtn: '#deflate-btn',
            pillowStatus: '#pillow-status',
            pillowActionIndicator: '#pillow-action-indicator',
            
            // Data displays
            recordsBody: '#records-body',
            logContainer: '#log-container',
            visualizer: '#visualizer',
            detectionChart: '#detection-chart',
            
            // System info
            modelStatus: '#model-status',
            gpioStatus: '#gpio-status',
            connectionStatus: '#connection-status',
            serverTime: '#server-time',
            
            // UI controls
            loadingOverlay: '#loading-overlay',
            errorNotification: '#error-notification',
            successNotification: '#success-notification',
            errorMessage: '#error-message',
            successMessage: '#success-message',
            refreshIndicator: '#refresh-indicator'
        };
        
        for (const [key, selector] of Object.entries(selectors)) {
            elements[key] = document.querySelector(selector);
            if (!elements[key]) {
                console.warn(`Element not found: ${selector}`);
            }
        }
        
        return elements;
    }
    
    /**
     * Initialize the system
     */
    init() {
        try {
            this.hideLoadingOverlay();
            this.initializeChart();
            this.bindEventListeners();
            this.startPeriodicUpdates();
            this.initializeVisualizer();
            this.loadInitialData();
            
            console.log('SnorePillowSystem initialized successfully');
        } catch (error) {
            this.handleError('System initialization failed', error);
        }
    }
    
    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await Promise.all([
                this.fetchStatus(),
                this.fetchSettings(),
                this.fetchDetectionHistory(),
                this.fetchLogs()
            ]);
            
            this.updateTime();
            this.showSuccessNotification('ระบบพร้อมใช้งาน');
        } catch (error) {
            this.handleError('Failed to load initial data', error);
        }
    }
    
    /**
     * Bind event listeners with error handling
     */
    bindEventListeners() {
        try {
            // Auto detection toggle
            if (this.elements.autoDetectToggle) {
                this.elements.autoDetectToggle.addEventListener('change', (e) => {
                    this.handleAutoDetectToggle(e.target.checked);
                });
            }
            
            // Delay slider
            if (this.elements.delaySlider) {
                this.elements.delaySlider.addEventListener('input', (e) => {
                    this.updateDelayDisplay(e.target.value);
                });
                
                this.elements.delaySlider.addEventListener('change', (e) => {
                    this.setDetectionDelay(parseInt(e.target.value));
                });
            }
            
            // Manual record button
            if (this.elements.manualRecordBtn) {
                this.elements.manualRecordBtn.addEventListener('click', () => {
                    this.startManualRecording();
                });
            }
            
            // Pillow control buttons
            const pillowButtons = [
                { element: this.elements.level1Btn, level: 1, duration: 35 },
                { element: this.elements.level2Btn, level: 2, duration: 50 },
                { element: this.elements.level3Btn, level: 3, duration: 70 },
                { element: this.elements.deflateBtn, level: 0, duration: 30 }
            ];
            
            pillowButtons.forEach(({ element, level, duration }) => {
                if (element) {
                    element.addEventListener('click', () => {
                        if (level === 0) {
                            this.deflatePillow(duration);
                        } else {
                            this.adjustPillow(level, duration);
                        }
                    });
                }
            });
            
            // Pump control buttons
            const pumpButtons = document.querySelectorAll('.pump-btn');
            pumpButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const pump = button.dataset.pump;
                    const action = button.dataset.action;
                    if (pump && action) {
                        this.controlPump(parseInt(pump), action, button);
                    }
                });
            });
            
            // Valve control buttons
            const valveButtons = document.querySelectorAll('.valve-btn');
            valveButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const valve = button.dataset.valve;
                    const action = button.dataset.action;
                    if (valve && action) {
                        this.controlValve(parseInt(valve), action, button);
                    }
                });
            });
            
            // Visualizer control
            const vizPlayBtn = document.getElementById('viz-play-btn');
            if (vizPlayBtn) {
                vizPlayBtn.addEventListener('click', () => {
                    this.toggleVisualizer();
                });
            }
            
            // Chart controls
            const chartResetBtn = document.getElementById('chart-reset-btn');
            if (chartResetBtn) {
                chartResetBtn.addEventListener('click', () => {
                    this.resetChart();
                });
            }
            
            // Log controls
            const logPauseBtn = document.getElementById('log-pause-btn');
            if (logPauseBtn) {
                logPauseBtn.addEventListener('click', () => {
                    this.toggleLogUpdates();
                });
            }
            
            const logDownloadBtn = document.getElementById('log-download-btn');
            if (logDownloadBtn) {
                logDownloadBtn.addEventListener('click', () => {
                    this.downloadLogs();
                });
            }
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                this.handleKeyboardShortcuts(e);
            });
            
            // Connection monitoring
            window.addEventListener('online', () => {
                this.state.systemStatus.connection = true;
                this.updateConnectionStatus();
                this.showSuccessNotification('การเชื่อมต่อกลับมาแล้ว');
            });
            
            window.addEventListener('offline', () => {
                this.state.systemStatus.connection = false;
                this.updateConnectionStatus();
                this.showErrorNotification('การเชื่อมต่อขาดหาย');
            });
            
        } catch (error) {
            this.handleError('Failed to bind event listeners', error);
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'r':
                    e.preventDefault();
                    this.startManualRecording();
                    break;
                case 's':
                    e.preventDefault();
                    this.handleAutoDetectToggle(!this.state.autoDetectEnabled);
                    break;
            }
        }
    }
    
    /**
     * API Request with retry logic and better error handling
     */
    async apiRequest(endpoint, options = {}) {
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: this.api.timeout,
            ...options
        };
        
        for (let attempt = 1; attempt <= this.api.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                const response = await fetch(endpoint, {
                    ...config,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Reset error count on successful request
                this.errorCount = 0;
                this.state.systemStatus.connection = true;
                this.updateConnectionStatus();
                
                return data;
                
            } catch (error) {
                console.warn(`API request attempt ${attempt} failed:`, error);
                
                if (attempt === this.api.retryAttempts) {
                    this.errorCount++;
                    this.state.systemStatus.connection = false;
                    this.updateConnectionStatus();
                    
                    if (this.errorCount >= this.maxErrors) {
                        this.showErrorNotification('การเชื่อมต่อมีปัญหา กรุณาตรวจสอบเซิร์ฟเวอร์');
                    }
                    
                    throw error;
                }
                
                // Wait before retry
                await this.sleep(this.api.retryDelay * attempt);
            }
        }
    }
    
    /**
     * Fetch system status
     */
    async fetchStatus() {
        try {
            this.showRefreshIndicator();
            const data = await this.apiRequest('/api/status');
            
            // Update state with proper fallbacks
            this.state.isRecording = data.recording || data.is_recording || false;
            this.state.autoDetectEnabled = data.auto_detect || data.auto_detect_enabled || false;
            this.state.detectionDelay = data.delay || data.detection_delay || 5;
            this.state.systemStatus.model_loaded = data.model_loaded || false;
            this.state.systemStatus.gpio_ready = data.gpio_ready || false;
            this.state.systemStatus.pump_active = data.pump || data.pump_status || false;
            
            // Log status for debugging
            console.log('Status updated:', {
                recording: this.state.isRecording,
                autoDetect: this.state.autoDetectEnabled,
                modelLoaded: this.state.systemStatus.model_loaded,
                gpioReady: this.state.systemStatus.gpio_ready
            });
            
            // Update UI
            this.updateStatusDisplay(data);
            this.updateIndicators();
            
        } catch (error) {
            this.handleError('Failed to fetch status', error);
        } finally {
            this.hideRefreshIndicator();
        }
    }
    
    /**
     * Update status display
     */
    updateStatusDisplay(data) {
        // Recording status
        if (this.elements.recordingStatus) {
            this.elements.recordingStatus.textContent = 
                (data.recording || data.is_recording) ? "กำลังอัดเสียง..." : "พร้อมใช้งาน";
        }
        
        // Pump status
        if (this.elements.pumpStatus) {
            this.elements.pumpStatus.textContent = 
                (data.pump || data.pump_status) ? "เปิด" : "ปิด";
        }
        
        // System status
        if (this.elements.systemStatus) {
            const statusText = this.getSystemStatusText(data);
            this.elements.systemStatus.textContent = statusText;
        }
        
        // Model status
        if (this.elements.modelStatus) {
            this.elements.modelStatus.textContent = 
                data.model_loaded ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน";
        }
        
        // GPIO status
        if (this.elements.gpioStatus) {
            this.elements.gpioStatus.textContent = 
                data.gpio_ready ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน";
        }
        
        // Auto detect status and toggle
        const autoDetectEnabled = data.auto_detect || data.auto_detect_enabled || false;
        if (this.elements.autoDetectStatus) {
            this.elements.autoDetectStatus.textContent = autoDetectEnabled ? "เปิด" : "ปิด";
        }
        
        if (this.elements.autoDetectToggle && this.elements.autoDetectToggle.checked !== autoDetectEnabled) {
            this.elements.autoDetectToggle.checked = autoDetectEnabled;
        }
        
        // Update card status
        const cardStatus = document.getElementById('auto-detect-card-status');
        if (cardStatus) {
            cardStatus.textContent = autoDetectEnabled ? "เปิด" : "ปิด";
            cardStatus.className = `card-status ${autoDetectEnabled ? 'active' : ''}`;
        }
        
        // Delay slider
        const delayValue = data.delay || data.detection_delay || 5;
        if (this.elements.delaySlider && this.elements.delayValue) {
            this.elements.delaySlider.value = delayValue;
            this.elements.delayValue.textContent = delayValue;
        }
    }
    
    /**
     * Get system status text
     */
    getSystemStatusText(data) {
        const issues = [];
        if (!data.model_loaded) issues.push('AI Model');
        if (!data.gpio_ready) issues.push('GPIO');
        if (!this.state.systemStatus.connection) issues.push('Connection');
        
        if (issues.length === 0) {
            return "ระบบพร้อมใช้งาน";
        } else {
            return `ปัญหา: ${issues.join(', ')}`;
        }
    }
    
    /**
     * Update indicators
     */
    updateIndicators() {
        // Recording indicator
        if (this.elements.recordingIndicator) {
            this.elements.recordingIndicator.className = 
                `status-indicator ${this.state.isRecording ? 'recording' : ''}`;
        }
        
        // Pump indicator
        if (this.elements.pumpIndicator) {
            this.elements.pumpIndicator.className = 
                `status-indicator ${this.state.systemStatus.pump_active ? 'active' : ''}`;
        }
        
        // Model indicator
        if (this.elements.modelIndicator) {
            this.elements.modelIndicator.className = 
                `indicator ${this.state.systemStatus.model_loaded ? 'active' : 'inactive'}`;
        }
        
        // GPIO indicator
        if (this.elements.gpioIndicator) {
            this.elements.gpioIndicator.className = 
                `indicator ${this.state.systemStatus.gpio_ready ? 'active' : 'inactive'}`;
        }
        
        // Connection indicator
        if (this.elements.connectionIndicator) {
            this.elements.connectionIndicator.className = 
                `indicator ${this.state.systemStatus.connection ? 'active' : 'inactive'}`;
        }
        
        // Mini indicators
        const miniIndicators = [
            { element: document.getElementById('model-mini-indicator'), active: this.state.systemStatus.model_loaded },
            { element: document.getElementById('gpio-mini-indicator'), active: this.state.systemStatus.gpio_ready },
            { element: document.getElementById('connection-mini-indicator'), active: this.state.systemStatus.connection }
        ];
        
        miniIndicators.forEach(({ element, active }) => {
            if (element) {
                element.className = `mini-indicator ${active ? 'active' : ''}`;
            }
        });
        
        // Update pump and valve button states based on system status
        this.updateAllPumpValveStates();
    }
    
    /**
     * Update all pump and valve button states
     */
    updateAllPumpValveStates() {
        // Reset all button states first
        const allPumpButtons = document.querySelectorAll('.pump-btn');
        const allValveButtons = document.querySelectorAll('.valve-btn');
        
        allPumpButtons.forEach(btn => btn.classList.remove('active'));
        allValveButtons.forEach(btn => btn.classList.remove('active'));
        
        // Update based on current system status if available
        // This would need to be expanded when we have real-time status from the server
    }
    
    /**
     * Fetch detection history
     */
    async fetchDetectionHistory() {
        try {
            const data = await this.apiRequest('/api/detection_history');
            this.updateDetectionHistory(data);
            this.updateChart(data);
        } catch (error) {
            this.handleError('Failed to fetch detection history', error);
        }
    }
    
    /**
     * Update detection history table
     */
    updateDetectionHistory(data) {
        if (!this.elements.recordsBody) return;
        
        if (!data || data.length === 0) {
            this.elements.recordsBody.innerHTML = 
                '<tr class="no-data"><td colspan="5">ยังไม่มีข้อมูลการตรวจจับ</td></tr>';
            return;
        }
        
        console.log('Updating detection history with data:', data);
        
        this.elements.recordsBody.innerHTML = '';
        
        // Show latest entries first
        const sortedData = [...data].reverse();
        
        sortedData.forEach((entry, index) => {
            const result = entry.result;
            const row = document.createElement('tr');
            const confidence = result.confidence || 0;
            const isSnoring = result.class_name === "กรน" && confidence > 75;
            const className = confidence > 75 ? 'detection-high' : 'detection-low';
            
            // Add visual indicator for recent entries
            const isRecent = index < 3;
            if (isRecent) {
                row.style.backgroundColor = '#f8f9fa';
                row.style.borderLeft = '4px solid #28a745';
            }
            
            row.innerHTML = `
                <td>${this.formatDateTime(entry.timestamp)}</td>
                <td class="${className}">
                    ${result.class_name}
                    ${result.model_type ? `<small>(${result.model_type})</small>` : ''}
                </td>
                <td>
                    <strong>${confidence.toFixed(2)}%</strong>
                    ${isRecent ? '<span style="color: #28a745;">●</span>' : ''}
                </td>
                <td>
                    <span class="${isSnoring ? 'text-success' : 'text-muted'}">
                        ${isSnoring ? '✅ เปิดทำงาน' : ' ไม่ทำงาน'}
                    </span>
                </td>
                <td>
                    ${entry.audio_file ? 
                        `<button class="mini-btn audio-btn" data-audio="/static/${entry.audio_file}" title="เล่นไฟล์เสียง"></button>` : 
                        '<span class="text-muted">ไม่มีไฟล์</span>'
                    }
                </td>
            `;
            
            // Add click handler for audio playback
            const audioBtn = row.querySelector('.audio-btn');
            if (audioBtn) {
                audioBtn.onclick = (e) => {
                    e.preventDefault();
                    this.playAudioFile(audioBtn.dataset.audio);
                };
            }
            
            this.elements.recordsBody.appendChild(row);
        });
        
        // Update latest detection result in status card
        if (data.length > 0) {
            const latest = data[data.length - 1].result;
            if (this.elements.detectionResult) {
                const confidence = latest.confidence || 0;
                const modelInfo = latest.model_type ? ` [${latest.model_type}]` : '';
                this.elements.detectionResult.textContent = 
                    `${latest.class_name} (${confidence.toFixed(2)}%)${modelInfo}`;
            }
            
            // Update confidence bar
            if (this.elements.confidenceFill) {
                const confidence = latest.confidence || 0;
                this.elements.confidenceFill.style.width = `${confidence}%`;
                
                // Update color based on confidence level
                if (confidence > 75) {
                    this.elements.confidenceFill.style.background = '#dc3545'; // Red for high confidence
                } else if (confidence > 50) {
                    this.elements.confidenceFill.style.background = '#ffc107'; // Yellow for medium
                } else {
                    this.elements.confidenceFill.style.background = '#28a745'; // Green for low
                }
            }
            
            console.log('Latest detection result updated:', latest);
        }
    }
    
    /**
     * Play audio file
     */
    playAudioFile(audioUrl) {
        try {
            // Stop any currently playing audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            
            // Create and play new audio
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.volume = 0.7;
            
            this.currentAudio.onloadstart = () => {
                this.showSuccessNotification('กำลังโหลดไฟล์เสียง...');
            };
            
            this.currentAudio.oncanplay = () => {
                this.showSuccessNotification('เล่นไฟล์เสียง');
            };
            
            this.currentAudio.onerror = (e) => {
                this.showErrorNotification('ไม่สามารถเล่นไฟล์เสียงได้');
                console.error('Audio playback error:', e);
            };
            
            this.currentAudio.onended = () => {
                this.currentAudio = null;
            };
            
            this.currentAudio.play();
            
        } catch (error) {
            this.showErrorNotification('เกิดข้อผิดพลาดในการเล่นไฟล์เสียง');
            console.error('Audio playback error:', error);
        }
    }
    
    /**
     * Format date time for display
     */
    formatDateTime(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return timestamp;
        }
    }
    
    /**
     * Update chart
     */
    updateChart(data) {
        if (!this.chart || !data) return;
        
        const labels = [];
        const confidenceData = [];
        const backgroundColors = [];
        
        data.forEach(entry => {
            const timestamp = new Date(entry.timestamp);
            labels.push(timestamp.toLocaleTimeString('th-TH', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }));
            
            const confidence = entry.result.confidence || 0;
            confidenceData.push(confidence);
            
            // Color based on confidence and classification
            if (entry.result.class_name === "กรน" && confidence > 75) {
                backgroundColors.push('rgba(231, 76, 60, 0.8)'); // Red for snoring
            } else {
                backgroundColors.push('rgba(39, 174, 96, 0.8)'); // Green for normal
            }
        });
        
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = confidenceData;
        this.chart.data.datasets[0].backgroundColor = backgroundColors;
        this.chart.data.datasets[0].borderColor = backgroundColors;
        this.chart.update('none'); // No animation for better performance
    }
    
    /**
     * Initialize chart
     */
    initializeChart() {
        if (!this.elements.detectionChart) return;
        
        try {
            const ctx = this.elements.detectionChart.getContext('2d');
            
            // Destroy existing chart
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'ความมั่นใจในการตรวจจับ (%)',
                        data: [],
                        backgroundColor: [],
                        borderColor: [],
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45
                            },
                            grid: {
                                display: false
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
        } catch (error) {
            this.handleError('Failed to initialize chart', error);
        }
    }
    
    /**
     * Reset chart
     */
    resetChart() {
        if (this.chart) {
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.data.datasets[0].backgroundColor = [];
            this.chart.data.datasets[0].borderColor = [];
            this.chart.update();
        }
    }
    
    /**
     * Fetch logs
     */
    async fetchLogs() {
        if (this.state.logPaused) return;
        
        try {
            const data = await this.apiRequest('/api/logs');
            this.updateLogs(data);
        } catch (error) {
            this.handleError('Failed to fetch logs', error);
        }
    }
    
    /**
     * Update logs display
     */
    updateLogs(data) {
        if (!this.elements.logContainer || !data) return;
        
        this.elements.logContainer.innerHTML = '';
        
        // Show latest logs first
        const reversedData = [...data].reverse();
        
        reversedData.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${this.getLogType(entry.message)}`;
            
            logEntry.innerHTML = `
                <span class="timestamp">[${entry.timestamp}]</span>
                <span class="message">${this.escapeHtml(entry.message)}</span>
            `;
            
            this.elements.logContainer.appendChild(logEntry);
        });
        
        // Auto-scroll to bottom for new entries
        if (!this.state.logPaused) {
            this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
        }
    }
    
    /**
     * Get log type based on message content
     */
    getLogType(message) {
        if (message.includes('❌') || message.includes('Error') || message.includes('Failed')) {
            return 'error';
        } else if (message.includes('⚠️') || message.includes('Warning')) {
            return 'warning';
        } else if (message.includes('✅') || message.includes('Success')) {
            return 'success';
        } else {
            return 'system';
        }
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Fetch settings
     */
    async fetchSettings() {
        try {
            const data = await this.apiRequest('/api/settings');
            
            this.state.autoDetectEnabled = data.auto_detect || false;
            this.state.detectionDelay = data.delay || 5;
            
            // Update UI
            if (this.elements.autoDetectToggle) {
                this.elements.autoDetectToggle.checked = this.state.autoDetectEnabled;
            }
            if (this.elements.autoDetectStatus) {
                this.elements.autoDetectStatus.textContent = this.state.autoDetectEnabled ? "เปิด" : "ปิด";
            }
            if (this.elements.delaySlider) {
                this.elements.delaySlider.value = this.state.detectionDelay;
            }
            if (this.elements.delayValue) {
                this.elements.delayValue.textContent = this.state.detectionDelay;
            }
            
        } catch (error) {
            this.handleError('Failed to fetch settings', error);
        }
    }
    
    /**
     * Handle auto detect toggle
     */
    async handleAutoDetectToggle(enabled) {
        try {
            const data = await this.apiRequest('/api/auto_detect', {
                method: 'POST',
                body: JSON.stringify({ enabled: enabled })
            });
            
            if (data.success) {
                this.state.autoDetectEnabled = enabled;
                this.elements.autoDetectStatus.textContent = enabled ? "เปิด" : "ปิด";
                
                // Update card status
                const cardStatus = document.getElementById('auto-detect-card-status');
                if (cardStatus) {
                    cardStatus.textContent = enabled ? "เปิด" : "ปิด";
                    cardStatus.className = `card-status ${enabled ? 'active' : ''}`;
                }
                
                this.showSuccessNotification(data.message);
            } else {
                // Revert toggle on failure
                this.elements.autoDetectToggle.checked = !enabled;
                this.showErrorNotification(data.message);
            }
        } catch (error) {
            // Revert toggle on error
            this.elements.autoDetectToggle.checked = !enabled;
            this.handleError('Failed to toggle auto detection', error);
        }
    }
    
    /**
     * Set detection delay
     */
    async setDetectionDelay(delay) {
        try {
            const data = await this.apiRequest('/api/set_delay', {
                method: 'POST',
                body: JSON.stringify({ delay: delay })
            });
            
            if (data.success) {
                this.state.detectionDelay = delay;
                this.showSuccessNotification(`ตั้งค่าระยะเวลาเป็น ${delay} นาที`);
            } else {
                this.showErrorNotification(data.message);
            }
        } catch (error) {
            this.handleError('Failed to set detection delay', error);
        }
    }
    
    /**
     * Update delay display
     */
    updateDelayDisplay(value) {
        if (this.elements.delayValue) {
            this.elements.delayValue.textContent = value;
        }
    }
    
    /**
     * Start manual recording
     */
    async startManualRecording() {
        if (this.state.isRecording) {
            this.showErrorNotification('กำลังอัดเสียงอยู่แล้ว');
            return;
        }
        
        try {
            // Disable button and show loading state
            if (this.elements.manualRecordBtn) {
                this.elements.manualRecordBtn.disabled = true;
                this.elements.manualRecordBtn.innerHTML = 
                    '<span class="btn-icon">⏳</span>กำลังบันทึกเสียง...';
            }
            
            // Update recording state immediately for UI feedback
            this.state.isRecording = true;
            this.updateRecordingUI();
            
            console.log('Starting manual recording...');
            
            const data = await this.apiRequest('/api/record', {
                method: 'POST'
            });
            
            console.log('Recording API response:', data);
            
            if (data.success) {
                this.showSuccessNotification('เริ่มบันทึกเสียงแล้ว กรุณารอสักครู่...');
                
                // Set up automatic refresh after recording completes
                const refreshAfterRecording = () => {
                    setTimeout(async () => {
                        console.log('Refreshing data after recording...');
                        try {
                            await Promise.all([
                                this.fetchStatus(),
                                this.fetchDetectionHistory(),
                                this.fetchLogs()
                            ]);
                            this.showSuccessNotification('การตรวจจับเสร็จสิ้น');
                        } catch (error) {
                            console.error('Failed to refresh after recording:', error);
                        }
                    }, 6000); // Wait 6 seconds for recording + prediction to complete
                };
                
                refreshAfterRecording();
                
            } else {
                this.showErrorNotification(data.message || 'การบันทึกเสียงล้มเหลว');
                // Reset recording state on failure
                this.state.isRecording = false;
                this.updateRecordingUI();
            }
        } catch (error) {
            this.handleError('Failed to start recording', error);
            // Reset recording state on error
            this.state.isRecording = false;
            this.updateRecordingUI();
        } finally {
            // Re-enable button after a delay
            if (this.elements.manualRecordBtn) {
                setTimeout(() => {
                    this.elements.manualRecordBtn.disabled = false;
                    this.elements.manualRecordBtn.innerHTML = 
                        '<span class="btn-icon">🎤</span>บันทึกและตรวจจับเสียงกรน';
                    // Reset recording state
                    this.state.isRecording = false;
                    this.updateRecordingUI();
                }, 8000); // Keep disabled for 8 seconds total
            }
        }
    }
    
    /**
     * Update recording UI
     */
    updateRecordingUI() {
        if (this.elements.recordingStatus) {
            this.elements.recordingStatus.textContent = 
                this.state.isRecording ? "กำลังอัดเสียง..." : "พร้อมใช้งาน";
        }
        
        if (this.elements.recordingIndicator) {
            this.elements.recordingIndicator.className = 
                `status-indicator ${this.state.isRecording ? 'recording' : ''}`;
        }
    }
    
    /**
     * Adjust pillow level
     */
    async adjustPillow(level, duration) {
        if (this.state.isPillowActionActive) {
            this.showErrorNotification('กรุณารอให้การปรับระดับปัจจุบันเสร็จสิ้นก่อน');
            return;
        }
        
        try {
            this.setPillowButtonsDisabled(true);
            this.showPillowStatus(`กำลังปรับระดับ ${level}...`, duration);
            
            const data = await this.apiRequest('/api/adjust_pillow', {
                method: 'POST',
                body: JSON.stringify({ level: level })
            });
            
            if (data.success) {
                this.showSuccessNotification(`กำลังปรับระดับหมอนเป็นระดับ ${level}`);
            } else {
                this.showErrorNotification(data.message);
                this.hidePillowStatus();
                this.setPillowButtonsDisabled(false);
            }
        } catch (error) {
            this.handleError('Failed to adjust pillow', error);
            this.hidePillowStatus();
            this.setPillowButtonsDisabled(false);
        }
    }
    
    /**
     * Deflate pillow
     */
    async deflatePillow(duration) {
        if (this.state.isPillowActionActive) {
            this.showErrorNotification('กรุณารอให้การปรับระดับปัจจุบันเสร็จสิ้นก่อน');
            return;
        }
        
        try {
            this.setPillowButtonsDisabled(true);
            this.showPillowStatus('กำลังดูดลมออก...', duration);
            
            const data = await this.apiRequest('/api/deflate_pillow', {
                method: 'POST'
            });
            
            if (data.success) {
                this.showSuccessNotification('กำลังดูดลมออกจากหมอน');
            } else {
                this.showErrorNotification(data.message);
                this.hidePillowStatus();
                this.setPillowButtonsDisabled(false);
            }
        } catch (error) {
            this.handleError('Failed to deflate pillow', error);
            this.hidePillowStatus();
            this.setPillowButtonsDisabled(false);
        }
    }
    
    /**
     * Set pillow buttons disabled state
     */
    setPillowButtonsDisabled(disabled) {
        this.state.isPillowActionActive = disabled;
        
        const buttons = [
            this.elements.level1Btn,
            this.elements.level2Btn,
            this.elements.level3Btn,
            this.elements.deflateBtn
        ];
        
        buttons.forEach(button => {
            if (button) {
                button.disabled = disabled;
            }
        });
        
        // Update action indicator
        if (this.elements.pillowActionIndicator) {
            this.elements.pillowActionIndicator.className = 
                `pillow-action-indicator ${disabled ? 'active' : ''}`;
        }
    }
    
    /**
     * Show pillow status with countdown
     */
    showPillowStatus(message, duration) {
        if (!this.elements.pillowStatus) return;
        
        this.elements.pillowStatus.className = 'pillow-status-text active';
        
        let timeLeft = duration;
        const updateStatus = () => {
            if (timeLeft > 0) {
                this.elements.pillowStatus.innerHTML = 
                    `<strong>${message}</strong><br>เหลือเวลาอีก ${timeLeft} วินาที`;
                timeLeft--;
                setTimeout(updateStatus, 1000);
            } else {
                this.elements.pillowStatus.innerHTML = 
                    `<strong>✅ ${message.replace('กำลัง', '').replace('...', '')}เสร็จสิ้น</strong>`;
                setTimeout(() => {
                    this.hidePillowStatus();
                    this.setPillowButtonsDisabled(false);
                }, 3000);
            }
        };
        
        updateStatus();
    }
    
    /**
     * Hide pillow status
     */
    hidePillowStatus() {
        if (this.elements.pillowStatus) {
            this.elements.pillowStatus.className = 'pillow-status-text';
        }
    }
    
    /**
     * Control pump (with valve)
     */
    async controlPump(pumpNumber, action, buttonElement = null) {
        try {
            if (buttonElement) {
                buttonElement.disabled = true;
                const originalText = buttonElement.innerHTML;
                buttonElement.innerHTML = `<span class="btn-icon">⏳</span>กำลัง${action === 'ON' ? 'เปิด' : 'ปิด'}...`;
            }
            
            console.log(`Controlling pump ${pumpNumber}: ${action}`);
            
            const data = await this.apiRequest('/api/pump', {
                method: 'POST',
                body: JSON.stringify({ 
                    pump: pumpNumber, 
                    action: action 
                })
            });
            
            if (data.success) {
                this.showSuccessNotification(data.message);
                
                // Update button states
                this.updatePumpButtonStates(pumpNumber, action);
                
            } else {
                this.showErrorNotification(data.message);
            }
            
        } catch (error) {
            this.handleError(`Failed to control pump ${pumpNumber}`, error);
        } finally {
            if (buttonElement) {
                setTimeout(() => {
                    buttonElement.disabled = false;
                    const pumpName = pumpNumber === 1 ? 'ปั๊ม 1 + วาล์ว 1' : 'ปั๊ม 2 + วาล์ว 2';
                    const actionName = action === 'ON' ? 'เปิด' : 'ปิด';
                    const icon = action === 'ON' ? (pumpNumber === 1 ? '💨' : '🌪️') : '⏹️';
                    buttonElement.innerHTML = `<span class="btn-icon">${icon}</span>${actionName}${pumpName}`;
                }, 1000);
            }
        }
    }
    
    /**
     * Control valve independently
     */
    async controlValve(valveNumber, action, buttonElement = null) {
        try {
            if (buttonElement) {
                buttonElement.disabled = true;
                const originalText = buttonElement.textContent;
                buttonElement.textContent = `${action === 'ON' ? 'เปิด' : 'ปิด'}...`;
            }
            
            console.log(`Controlling valve ${valveNumber}: ${action}`);
            
            const data = await this.apiRequest('/api/valve', {
                method: 'POST',
                body: JSON.stringify({ 
                    valve: valveNumber, 
                    action: action 
                })
            });
            
            if (data.success) {
                this.showSuccessNotification(data.message);
                
                // Update button states
                this.updateValveButtonStates(valveNumber, action);
                
            } else {
                this.showErrorNotification(data.message);
            }
            
        } catch (error) {
            this.handleError(`Failed to control valve ${valveNumber}`, error);
        } finally {
            if (buttonElement) {
                setTimeout(() => {
                    buttonElement.disabled = false;
                    const actionName = action === 'ON' ? 'เปิด' : 'ปิด';
                    buttonElement.textContent = `${actionName}วาล์ว ${valveNumber}`;
                }, 1000);
            }
        }
    }
    
    /**
     * Update pump button states
     */
    updatePumpButtonStates(pumpNumber, action) {
        const pumpOnBtn = document.getElementById(`pump${pumpNumber}-on-btn`);
        const pumpOffBtn = document.getElementById(`pump${pumpNumber}-off-btn`);
        
        if (pumpOnBtn && pumpOffBtn) {
            if (action === 'ON') {
                pumpOnBtn.classList.add('active');
                pumpOffBtn.classList.remove('active');
            } else {
                pumpOnBtn.classList.remove('active');
                pumpOffBtn.classList.add('active');
            }
        }
    }
    
    /**
     * Update valve button states
     */
    updateValveButtonStates(valveNumber, action) {
        const valveOnBtn = document.getElementById(`valve${valveNumber}-on-btn`);
        const valveOffBtn = document.getElementById(`valve${valveNumber}-off-btn`);
        
        if (valveOnBtn && valveOffBtn) {
            if (action === 'ON') {
                valveOnBtn.classList.add('active');
                valveOffBtn.classList.remove('active');
            } else {
                valveOnBtn.classList.remove('active');
                valveOffBtn.classList.add('active');
            }
        }
    }
    
    /**
     * Initialize visualizer
     */
    initializeVisualizer() {
        if (!this.elements.visualizer) return;
        
        const canvas = this.elements.visualizer;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        let animationId;
        
        const drawWaveform = () => {
            if (!this.state.visualizerActive) return;
            
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;
            
            ctx.clearRect(0, 0, width, height);
            
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#f0f8ff');
            gradient.addColorStop(1, '#e6f3ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Draw waveform
            ctx.beginPath();
            ctx.strokeStyle = this.state.isRecording ? '#e74c3c' : '#3498db';
            ctx.lineWidth = 2;
            
            const time = Date.now() / 1000;
            const amplitude = this.state.isRecording ? height / 3 : height / 6;
            const frequency = this.state.isRecording ? 4 : 2;
            
            for (let x = 0; x < width; x++) {
                const y = centerY + Math.sin((x / width) * Math.PI * frequency + time * 2) * 
                         amplitude * Math.sin(time + x / 50);
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            
            animationId = requestAnimationFrame(drawWaveform);
        };
        
        this.visualizerAnimation = { 
            start: drawWaveform, 
            stop: () => cancelAnimationFrame(animationId) 
        };
        drawWaveform();
    }
    
    /**
     * Toggle visualizer
     */
    toggleVisualizer() {
        this.state.visualizerActive = !this.state.visualizerActive;
        
        const vizPlayBtn = document.getElementById('viz-play-btn');
        if (vizPlayBtn) {
            vizPlayBtn.textContent = this.state.visualizerActive ? '⏸️' : '▶️';
        }
        
        if (this.state.visualizerActive && this.visualizerAnimation) {
            this.visualizerAnimation.start();
        }
    }
    
    /**
     * Toggle log updates
     */
    toggleLogUpdates() {
        this.state.logPaused = !this.state.logPaused;
        
        const logPauseBtn = document.getElementById('log-pause-btn');
        if (logPauseBtn) {
            logPauseBtn.textContent = this.state.logPaused ? '▶️' : '⏸️';
        }
        
        if (!this.state.logPaused) {
            this.fetchLogs();
        }
    }
    
    /**
     * Download logs
     */
    downloadLogs() {
        this.apiRequest('/api/logs')
            .then(data => {
                const logText = data.map(entry => 
                    `[${entry.timestamp}] ${entry.message}`
                ).join('\n');
                
                const blob = new Blob([logText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `snore-system-logs-${new Date().toISOString().split('T')[0]}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showSuccessNotification('ดาวน์โหลดล็อกเสร็จสิ้น');
            })
            .catch(error => {
                this.handleError('Failed to download logs', error);
            });
    }
    
    /**
     * Update time display
     */
    updateTime() {
        if (this.elements.serverTime) {
            this.elements.serverTime.textContent = 
                new Date().toLocaleString('th-TH');
        }
    }
    
    /**
     * Update connection status
     */
    updateConnectionStatus() {
        if (this.elements.connectionStatus) {
            this.elements.connectionStatus.textContent = 
                this.state.systemStatus.connection ? "เชื่อมต่อแล้ว" : "ขาดการเชื่อมต่อ";
        }
        
        this.updateIndicators();
    }
    
    /**
     * Start periodic updates
     */
    startPeriodicUpdates() {
        // Clear existing intervals
        this.stopPeriodicUpdates();
        
        // Set new intervals
        this.intervals.status = setInterval(() => this.fetchStatus(), 3000);
        this.intervals.history = setInterval(() => this.fetchDetectionHistory(), 5000);
        this.intervals.logs = setInterval(() => this.fetchLogs(), 5000);
        this.intervals.time = setInterval(() => this.updateTime(), 1000);
    }
    
    /**
     * Stop periodic updates
     */
    stopPeriodicUpdates() {
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
    }
    
    /**
     * Show/hide loading overlay
     */
    showLoadingOverlay() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('hidden');
        }
    }
    
    hideLoadingOverlay() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Show/hide refresh indicator
     */
    showRefreshIndicator() {
        if (this.elements.refreshIndicator) {
            this.elements.refreshIndicator.classList.add('active');
        }
    }
    
    hideRefreshIndicator() {
        if (this.elements.refreshIndicator) {
            this.elements.refreshIndicator.classList.remove('active');
        }
    }
    
    /**
     * Show error notification
     */
    showErrorNotification(message) {
        if (this.elements.errorNotification && this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorNotification.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideNotification('error-notification');
            }, 5000);
        }
    }
    
    /**
     * Show success notification
     */
    showSuccessNotification(message) {
        if (this.elements.successNotification && this.elements.successMessage) {
            this.elements.successMessage.textContent = message;
            this.elements.successNotification.classList.remove('hidden');
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                this.hideNotification('success-notification');
            }, 3000);
        }
    }
    
    /**
     * Hide notification
     */
    hideNotification(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.classList.add('hidden');
        }
    }
    
    /**
     * Handle errors
     */
    handleError(context, error) {
        console.error(`${context}:`, error);
        
        let errorMessage = 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
        
        if (error.name === 'AbortError') {
            errorMessage = 'การเชื่อมต่อหมดเวลา';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        this.showErrorNotification(`${context}: ${errorMessage}`);
    }
    
    /**
     * Utility: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Cleanup when page unloads
     */
    cleanup() {
        this.stopPeriodicUpdates();
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        if (this.visualizerAnimation) {
            this.visualizerAnimation.stop();
        }
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    }
}

// Global functions for backward compatibility
window.hideNotification = function(id) {
    const notification = document.getElementById(id);
    if (notification) {
        notification.classList.add('hidden');
    }
};

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.snoreSystem = new SnorePillowSystem();
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            if (window.snoreSystem) {
                window.snoreSystem.cleanup();
            }
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (window.snoreSystem) {
                if (document.hidden) {
                    // Page is hidden, reduce update frequency
                    window.snoreSystem.stopPeriodicUpdates();
                } else {
                    // Page is visible, resume normal updates
                    window.snoreSystem.startPeriodicUpdates();
                    window.snoreSystem.fetchStatus();
                }
            }
        });
        
    } catch (error) {
        console.error('Failed to initialize SnorePillowSystem:', error);
        
        // Show fallback error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'notification error';
        errorDiv.innerHTML = `
            <span>ไม่สามารถเริ่มต้นระบบได้: ${error.message}</span>
            <button onclick="location.reload()" aria-label="รีโหลดหน้า">🔄</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Service Worker registration for PWA support (with error handling)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Check if service worker file exists before registering
        fetch('/static/sw.js')
            .then(response => {
                if (response.ok) {
                    return navigator.serviceWorker.register('/static/sw.js');
                } else {
                    console.log('Service Worker file not found, skipping registration');
                    return null;
                }
            })
            .then(function(registration) {
                if (registration) {
                    console.log('ServiceWorker registered successfully');
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New content is available
                                if (window.snoreSystem) {
                                    window.snoreSystem.showSuccessNotification(
                                        'มีอัปเดตใหม่ กรุณารีโหลดหน้าเว็บ'
                                    );
                                }
                            }
                        });
                    });
                }
            })
            .catch(function(registrationError) {
                console.log('ServiceWorker registration failed:', registrationError);
            });
    });
}

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log(`Page load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
                console.log(`DOM ready time: ${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`);
            }
        }, 0);
    });
}

// Export for testing (ใช้เมื่อ Node.js environment เท่านั้น)
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = SnorePillowSystem;
// }
