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
        // Level 1：基础一元一次方程（直接求解）
        level1: [
            { type: "fill", question: "解方程：2x + 5 = 15，求 x 的值", answer: 5 },
            { type: "fill", question: "解方程：3x - 7 = 8，求 x 的值", answer: 5 },
            { type: "choice", question: "方程 5x + 3 = 23 的解是？", options: ["x=4", "x=5", "x=6", "x=3"], answer: "x=4" },
            { type: "choice", question: "解方程：4x - 12 = 20，x 的值为？", options: ["x=7", "x=8", "x=9", "x=6"], answer: "x=8" },
            { type: "fill", question: "解方程：x ÷ 4 + 2 = 5，求 x 的值", answer: 12 }
        ],
        // Level 2：稍复杂一元一次方程（含括号、移项）
        level2: [
            { type: "choice", question: "解方程：2(x + 3) = 16，x = ?", options: ["x=5", "x=6", "x=7", "x=8"], answer: "x=5" },
            { type: "fill", question: "解方程：3(2x - 4) = 18，求 x 的值", answer: 5 },
            { type: "choice", question: "5x - 3(x - 2) = 16，x 的解是？", options: ["x=5", "x=6", "x=7", "x=8"], answer: "x=5" },
            { type: "fill", question: "解方程：(x + 8) ÷ 2 = 9，求 x 的值", answer: 10 },
            { type: "choice", question: "4x + 2(5 - x) = 22，x = ?", options: ["x=6", "x=7", "x=8", "x=9"], answer: "x=6" }
        ],
        // Level 3：复杂方程/方程组/方程应用
        level3: [
            { type: "fill", question: "解方程组：{x + y = 10, x - y = 2}，求 x 的值", answer: 6 },
            { type: "choice", question: "某数的 3 倍比它的 2 倍多 5，设该数为 x，方程正确的是？", options: ["3x - 2x = 5", "3x + 2x = 5", "3x = 2x - 5", "2x - 3x = 5"], answer: "3x - 2x = 5" },
            { type: "fill", question: "解方程：2x + 3(4 - x) = 11，求 x 的值", answer: 1 },
            { type: "choice", question: "解方程组：{2x + y = 13, x + 2y = 14}，x + y 的值是？", options: ["9", "10", "11", "12"], answer: "9" },
            { type: "fill", question: "甲有 x 元，乙的钱数是甲的 2 倍多 3 元，两人共有 33 元，求 x 的值", answer: 10 }
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
    certTimeEl: document.getElementById("cert-time"),
    // 新增：关闭网页按钮
    closePageBtn: document.getElementById("close-page-btn"),
    closePageBtnGame: document.getElementById("close-page-btn-game"),
    closePageBtnCert: document.getElementById("close-page-btn-cert")
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

// ---------------------- 4. 新增：关闭网页函数 ----------------------
function closeWebPage() {
    if (confirm("确定要关闭网页吗？当前进度会保存！")) {
        window.close(); // 关闭当前浏览器标签页
    }
}

// ---------------------- 5. 事件绑定 ----------------------
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
    
    // 退出游戏（返回登录页）
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
    
    // 关闭证书（返回登录页）
    elements.closeCertBtn.addEventListener("click", () => {
        showLoginPage();
    });
    
    // 点击模态框外部关闭
    elements.rankModal.addEventListener("click", (e) => {
        if (e.target === elements.rankModal) {
            elements.rankModal.classList.remove("active");
        }
    });
    
    // ---------------------- 新增：绑定关闭网页按钮事件 ----------------------
    elements.closePageBtn.addEventListener("click", closeWebPage);
    elements.closePageBtnGame.addEventListener("click", closeWebPage);
    elements.closePageBtnCert.addEventListener("click", closeWebPage);
}

// ---------------------- 程序入口 ----------------------
function init() {
    initRanking();
    initEvents();
    showLoginPage();
}

// 启动游戏
window.addEventListener("load", init);