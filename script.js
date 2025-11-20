// 游戏状态管理
const gameState = {
    userName: "",
    currentLevel: 1,
    currentQuestion: 0,
    score: 0,
    questionList: [],
    usedQuestions: new Set(),
    selectedOption: null,
    questionBank: {
        // 题库（可修改或替换为外部JSON，这里内置示例）
        level1: [
            { type: "fill", question: "5 + 3 × 2 = ?", answer: 11 },
            { type: "fill", question: "18 ÷ (3 + 3) = ?", answer: 3 },
            { type: "choice", question: "下列哪个是方程 2x + 5 = 15 的解？", options: ["x=5", "x=10", "x=3", "x=7"], answer: "x=5" },
            { type: "choice", question: "3x - 7 = 8，x 的值是？", options: ["x=3", "x=5", "x=4", "x=6"], answer: "x=5" },
            { type: "fill", question: "4 × (6 - 2) = ?", answer: 16 }
        ],
        level2: [
            { type: "choice", question: "方程 5x - 12 = 18 的解是？", options: ["x=6", "x=5", "x=7", "x=8"], answer: "x=6" },
            { type: "fill", question: "7 × 8 - 12 ÷ 3 = ?", answer: 52 },
            { type: "choice", question: "(x + 4) × 2 = 18，x = ?", options: ["x=5", "x=6", "x=7", "x=8"], answer: "x=5" },
            { type: "fill", question: "100 - (25 + 35) ÷ 2 = ?", answer: 70 },
            { type: "choice", question: "3x + 2x = 25，x = ?", options: ["x=4", "x=5", "x=6", "x=7"], answer: "x=5" }
        ],
        level3: [
            { type: "fill", question: "5 × (3 + 2 × 4) - 10 = ?", answer: 45 },
            { type: "choice", question: "2(x - 3) + 5 = 15，x = ?", options: ["x=8", "x=7", "x=9", "x=6"], answer: "x=8" },
            { type: "fill", question: "(48 ÷ 8 + 3) × 2 = ?", answer: 18 },
            { type: "choice", question: "5x - 3(x + 2) = 10，x = ?", options: ["x=7", "x=8", "x=9", "x=6"], answer: "x=8" },
            { type: "fill", question: "12 × [ (7 - 4) × 2 ] = ?", answer: 72 }
        ]
    }
};

// DOM 元素
const elements = {
    loginPage: document.getElementById("login-page"),
    gamePage: document.getElementById("game-page"),
    certificatePage: document.getElementById("certificate-page"),
    rankModal: document.getElementById("rank-modal"),
    usernameInput: document.getElementById("username"),
    startBtn: document.getElementById("start-btn"),
    submitBtn: document.getElementById("submit-btn"),
    quitBtn: document.getElementById("quit-btn"),
    rankBtn: document.getElementById("rank-btn"),
    closeRankBtn: document.getElementById("close-rank-btn"),
    closeCertBtn: document.getElementById("close-cert-btn"),
    currentLevelEl: document.getElementById("current-level"),
    currentScoreEl: document.getElementById("current-score"),
    questionIndexEl: document.getElementById("question-index"),
    questionContentEl: document.getElementById("question-content"),
    answerAreaEl: document.getElementById("answer-area"),
    rankListEl: document.getElementById("rank-list"),
    certUsernameEl: document.getElementById("cert-username"),
    certScoreEl: document.getElementById("cert-score"),
    certTimeEl: document.getElementById("cert-time")
};

// ---------------------- 1. 排行榜本地存储（替代JSON文件） ----------------------
const RANK_KEY = "equation_ranking";

// 初始化排行榜
function initRanking() {
    if (!localStorage.getItem(RANK_KEY)) {
        localStorage.setItem(RANK_KEY, JSON.stringify([]));
    }
}

// 获取排行榜数据
function getRanking() {
    initRanking();
    try {
        return JSON.parse(localStorage.getItem(RANK_KEY)) || [];
    } catch (e) {
        localStorage.setItem(RANK_KEY, JSON.stringify([]));
        return [];
    }
}

// 保存分数到排行榜
function saveRanking(name, score) {
    const ranking = getRanking();
    const newRecord = {
        name,
        score,
        time: new Date().toLocaleString()
    };
    ranking.push(newRecord);
    // 按分数降序排序，保留前10名
    ranking.sort((a, b) => b.score - a.score);
    localStorage.setItem(RANK_KEY, JSON.stringify(ranking.slice(0, 10)));
}

// 显示排行榜
function renderRanking() {
    const ranking = getRanking();
    elements.rankListEl.innerHTML = "";
    
    if (ranking.length === 0) {
        elements.rankListEl.innerHTML = "<p style='padding:20px; color:#e74c3c'>暂无排行榜数据</p>";
        return;
    }
    
    ranking.forEach((item, index) => {
        const rankItem = document.createElement("div");
        rankItem.className = "rank-item";
        rankItem.innerHTML = `
            <span>${index + 1}</span>
            <span>${item.name}</span>
            <span>${item.score}</span>
            <span>${item.time}</span>
        `;
        elements.rankListEl.appendChild(rankItem);
    });
}

// ---------------------- 2. 题目处理 ----------------------
// 随机抽取当前关卡题目
function getRandomQuestions() {
    const levelKey = `level${gameState.currentLevel}`;
    const allQuestions = gameState.questionBank[levelKey];
    // 过滤已使用题目
    const availableQuestions = allQuestions.filter(q => !gameState.usedQuestions.has(q.question));
    
    let selectedQuestions;
    if (availableQuestions.length >= 3) {
        selectedQuestions = availableQuestions.sort(() => 0.5 - Math.random()).slice(0, 3);
    } else {
        // 题目用尽，重置已使用列表
        gameState.usedQuestions.clear();
        selectedQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 3);
    }
    
    // 记录已使用题目
    selectedQuestions.forEach(q => gameState.usedQuestions.add(q.question));
    return selectedQuestions;
}

// 渲染当前题目
function renderQuestion() {
    const currentQ = gameState.questionList[gameState.currentQuestion];
    elements.currentLevelEl.textContent = gameState.currentLevel;
    elements.currentScoreEl.textContent = gameState.score;
    elements.questionIndexEl.textContent = gameState.currentQuestion + 1;
    elements.questionContentEl.textContent = currentQ.question;
    elements.answerAreaEl.innerHTML = "";
    gameState.selectedOption = null;
    
    if (currentQ.type === "fill") {
        // 填空题
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "请输入数字答案";
        input.id = "fill-answer";
        elements.answerAreaEl.appendChild(input);
        input.focus();
    } else {
        // 选择题
        currentQ.options.forEach((option, index) => {
            const optionItem = document.createElement("div");
            optionItem.className = "option-item";
            optionItem.innerHTML = `
                <input type="radio" name="option" id="option-${index}" value="${index}">
                <label for="option-${index}">${String.fromCharCode(65 + index)}. ${option}</label>
            `;
            elements.answerAreaEl.appendChild(optionItem);
            
            // 绑定选择事件
            const radio = optionItem.querySelector("input");
            radio.addEventListener("change", () => {
                gameState.selectedOption = index;
            });
        });
    }
}

// ---------------------- 3. 页面切换 ----------------------
// 显示登录页
function showLoginPage() {
    elements.loginPage.classList.add("active");
    elements.gamePage.classList.remove("active");
    elements.certificatePage.classList.remove("active");
    elements.rankModal.classList.remove("active");
}

// 显示游戏页
function showGamePage() {
    elements.loginPage.classList.remove("active");
    elements.gamePage.classList.add("active");
    elements.certificatePage.classList.remove("active");
    elements.rankModal.classList.remove("active");
    gameState.questionList = getRandomQuestions();
    renderQuestion();
}

// 显示证书页
function showCertificatePage() {
    elements.loginPage.classList.remove("active");
    elements.gamePage.classList.remove("active");
    elements.certificatePage.classList.add("active");
    elements.rankModal.classList.remove("active");
    
    elements.certUsernameEl.textContent = gameState.userName;
    elements.certScoreEl.textContent = gameState.score;
    elements.certTimeEl.textContent = new Date().toLocaleString();
}

// ---------------------- 4. 事件绑定 ----------------------
// 初始化事件
function initEvents() {
    // 开始游戏
    elements.startBtn.addEventListener("click", () => {
        const userName = elements.usernameInput.value.trim();
        if (!userName) {
            alert("请输入姓名或小组编号！");
            return;
        }
        gameState.userName = userName;
        gameState.currentLevel = 1;
        gameState.currentQuestion = 0;
        gameState.score = 0;
        gameState.usedQuestions.clear();
        showGamePage();
    });
    
    // 提交答案
    elements.submitBtn.addEventListener("click", () => {
        const currentQ = gameState.questionList[gameState.currentQuestion];
        let userAnswer = null;
        let isAnswerValid = true;
        
        if (currentQ.type === "fill") {
            const input = document.getElementById("fill-answer");
            const inputValue = input.value.trim();
            if (!inputValue || isNaN(inputValue)) {
                alert("请输入有效的数字！");
                input.focus();
                isAnswerValid = false;
            } else {
                userAnswer = parseInt(inputValue);
            }
        } else {
            if (gameState.selectedOption === null) {
                alert("请选择一个答案！");
                isAnswerValid = false;
            } else {
                userAnswer = currentQ.options[gameState.selectedOption];
            }
        }
        
        if (!isAnswerValid) return;
        
        // 判断答案
        if (userAnswer === currentQ.answer) {
            // 计算得分
            const levelScore = gameState.currentLevel === 1 ? 10 : gameState.currentLevel === 2 ? 20 : 30;
            gameState.score += levelScore;
            alert(`回答正确！获得${levelScore}分，当前总积分：${gameState.score}分`);
        } else {
            alert("回答错误！本题不得分，继续下一题");
        }
        
        // 下一题/下一关/通关
        gameState.currentQuestion += 1;
        if (gameState.currentQuestion < 3) {
            renderQuestion();
        } else {
            if (gameState.currentLevel < 3) {
                gameState.currentLevel += 1;
                gameState.currentQuestion = 0;
                gameState.questionList = getRandomQuestions();
                alert(`第${gameState.currentLevel - 1}关已通关！进入第${gameState.currentLevel}关`);
                renderQuestion();
            } else {
                // 全部通关
                saveRanking(gameState.userName, gameState.score);
                showCertificatePage();
            }
        }
    });
    
    // 退出游戏
    elements.quitBtn.addEventListener("click", () => {
        if (confirm("确定要退出游戏吗？当前进度会保存！")) {
            showLoginPage();
        }
    });
    
    // 显示排行榜
    elements.rankBtn.addEventListener("click", () => {
        renderRanking();
        elements.rankModal.classList.add("active");
    });
    
    // 关闭排行榜
    elements.closeRankBtn.addEventListener("click", () => {
        elements.rankModal.classList.remove("active");
    });
    
    // 关闭证书
    elements.closeCertBtn.addEventListener("click", () => {
        showLoginPage();
    });
    
    // 点击模态框外部关闭
    elements.rankModal.addEventListener("click", (e) => {
        if (e.target === elements.rankModal) {
            elements.rankModal.classList.remove("active");
        }
    });
}

// ---------------------- 程序入口 ----------------------
function init() {
    initRanking();
    initEvents();
    showLoginPage();
}

// 启动游戏
window.addEventListener("load", init);