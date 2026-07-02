// ==================== 全局變數 ====================
let currentBalance = 52800.00;
let transactions = [];
let favorites = [
    { name: "陳美玲", account: "234-567890-112" },
    { name: "李志明", account: "345-112233-445" },
    { name: "何太太", account: "123-456789-001" }
];

// ==================== 資料持久化 ====================
function saveData() {
    localStorage.setItem('bankBalance', currentBalance.toString());
    localStorage.setItem('bankTransactions', JSON.stringify(transactions));
    localStorage.setItem('bankFavorites', JSON.stringify(favorites));
}

function loadData() {
    const savedBalance = localStorage.getItem('bankBalance');
    if (savedBalance) currentBalance = parseFloat(savedBalance);

    const savedTx = localStorage.getItem('bankTransactions');
    if (savedTx) transactions = JSON.parse(savedTx);

    const savedFav = localStorage.getItem('bankFavorites');
    if (savedFav) favorites = JSON.parse(savedFav);
}

// ==================== 工具函數 ====================
function formatCurrency(amount) {
    return amount.toLocaleString('en-HK', { minimumFractionDigits: 2 });
}

function updateBalance() {
    const el = document.getElementById('balance');
    if (el) el.textContent = formatCurrency(currentBalance);
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.classList.remove('hidden');
    }
}

function hideError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function hideAllErrors() {
    ['accountError', 'nameError', 'amountError'].forEach(hideError);
}

// ==================== Tab 切換 ====================
function switchTab(tabIndex) {
    document.querySelectorAll('[id^="tab-content-"]').forEach(el => {
        if (el) el.classList.add('hidden');
    });
    document.querySelectorAll('[id^="tab-"]').forEach(el => {
        if (el) el.classList.remove('active', 'text-[#003087]', 'border-b-2', 'border-[#003087]');
    });
    
    const content = document.getElementById(`tab-content-${tabIndex}`);
    if (content) content.classList.remove('hidden');
    
    const activeTab = document.getElementById(`tab-${tabIndex}`);
    if (activeTab) activeTab.classList.add('active', 'text-[#003087]', 'border-b-2', 'border-[#003087]');
    
    if (tabIndex === 1) renderHistory();
}

// ==================== 常用收款人 ====================
function renderFavorites() {
    const container = document.getElementById('favoriteList');
    if (!container) return;
    container.innerHTML = '';
    
    favorites.forEach(fav => {
        const btn = document.createElement('button');
        btn.className = 'px-4 py-2 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 rounded-2xl text-sm flex items-center gap-x-2 transition';
        btn.innerHTML = `
            <div class="text-left">
                <div class="font-medium text-sm">${fav.name}</div>
                <div class="font-mono text-[10px] text-zinc-400">${fav.account}</div>
            </div>
        `;
        btn.onclick = () => {
            document.getElementById('recipientAccount').value = fav.account;
            document.getElementById('recipientName').value = fav.name;
            document.getElementById('amount').focus();
        };
        container.appendChild(btn);
    });
}

// ==================== 快速金額 ====================
function quickAmount(amount) {
    const input = document.getElementById('amount');
    if (input) {
        input.value = amount;
        input.focus();
        hideError('amountError');
    }
}

// ==================== 表單驗證 ====================
function validateForm() {
    hideAllErrors();
    
    const account = document.getElementById('recipientAccount').value.trim();
    const name = document.getElementById('recipientName').value.trim();
    const amountStr = document.getElementById('amount').value;
    const amount = parseFloat(amountStr);
    
    let valid = true;
    
    if (!account || account.length < 8) {
        showError('accountError', '請輸入有效的收款人帳號（至少8位）');
        valid = false;
    }
    if (!name || name.length < 2) {
        showError('nameError', '請輸入收款人姓名');
        valid = false;
    }
    if (!amountStr || isNaN(amount) || amount <= 0) {
        showError('amountError', '請輸入有效的轉帳金額');
        valid = false;
    } else if (amount > currentBalance) {
        showError('amountError', `餘額不足！目前可用餘額 HK$${formatCurrency(currentBalance)}`);
        valid = false;
    }
    
    return valid ? { account, name, amount } : null;
}

// ==================== Modal 控制 ====================
let currentTransferData = {};

function showConfirmModal(data) {
    currentTransferData = data;
    document.getElementById('confirmName').textContent = data.name;
    document.getElementById('confirmAccount').textContent = data.account;
    document.getElementById('confirmAmount').textContent = `HK$ ${formatCurrency(data.amount)}`;
    
    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmModal').classList.add('flex');
}

function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}

function processTransfer() {
    hideConfirmModal();
    
    setTimeout(() => {
        const data = currentTransferData;
        currentBalance -= data.amount;
        updateBalance();
        
        const now = new Date();
        const txnId = 'TXN' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
        
        const newTxn = {
            id: txnId,
            date: now.toLocaleString('zh-HK', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
            }).replace(/\//g, '-'),
            amount: data.amount,
            to: data.name,
            account: data.account,
            note: data.note || '',
            type: 'out'
        };
        
        transactions.unshift(newTxn);
        saveData();
        showSuccessModal(newTxn);
    }, 1200);
}

function showSuccessModal(txn) {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    
    document.getElementById('successTxnId').textContent = txn.id;
    document.getElementById('successName').textContent = txn.to;
    document.getElementById('successAmount').textContent = `- HK$ ${formatCurrency(txn.amount)}`;
    document.getElementById('successNewBalance').textContent = `HK$ ${formatCurrency(currentBalance)}`;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function completeTransfer() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
    const form = document.getElementById('transferForm');
    if (form) form.reset();
    hideAllErrors();
    switchTab(1);
}

// ==================== 交易記錄 ====================
function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    container.innerHTML = '';
    
    if (transactions.length === 0) {
        container.innerHTML = `<div class="py-10 text-center text-zinc-400 text-sm">暫無交易記錄</div>`;
        return;
    }
    
    transactions.forEach(tx => {
        const row = document.createElement('div');
        row.className = `transaction-row px-5 py-4 flex justify-between items-center border-b last:border-b-0`;
        row.innerHTML = `
            <div class="flex-1">
                <div class="font-medium">${tx.to}</div>
                <div class="text-xs text-zinc-400 font-mono">${tx.account} • ${tx.date}</div>
                ${tx.note ? `<div class="text-xs text-zinc-500 mt-1">${tx.note}</div>` : ''}
            </div>
            <div class="text-right">
                <div class="font-semibold text-red-600">- HK$ ${formatCurrency(tx.amount)}</div>
                <div class="text-[10px] text-zinc-400 font-mono">${tx.id}</div>
            </div>
        `;
        container.appendChild(row);
    });
}

function exportToCSV() {
    if (transactions.length === 0) {
        alert('目前沒有交易記錄可以匯出');
        return;
    }
    
    let csv = '\ufeff交易編號,日期,收款人,帳號,金額,備註\n';
    transactions.forEach(tx => {
        csv += `${tx.id},${tx.date},${tx.to},${tx.account},${tx.amount},"${tx.note || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `交易記錄_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

function clearAllHistory() {
    if (!confirm('確定要清除所有交易記錄嗎？此操作無法復原。')) return;
    transactions = [];
    saveData();
    renderHistory();
}

// ==================== 初始化 ====================
function init() {
    loadData();
    updateBalance();
    renderFavorites();
    switchTab(0);
    
    const form = document.getElementById('transferForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const data = validateForm();
            if (!data) return;
            const note = document.getElementById('note') ? document.getElementById('note').value.trim() : '';
            showConfirmModal({ ...data, note });
        });
    }
    
    console.log('%cDemoBank 已載入成功', 'color:#10b981');
}

document.addEventListener('DOMContentLoaded', init);

// 暴露全局函數
window.quickAmount = quickAmount;
window.switchTab = switchTab;
window.showAccountModal = () => alert('帳戶詳情 (Demo)');
window.exportToCSV = exportToCSV;
window.clearAllHistory = clearAllHistory;
window.setBalance = (val) => {
    currentBalance = val;
    updateBalance();
    saveData();
};