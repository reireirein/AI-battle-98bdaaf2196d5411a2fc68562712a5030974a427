document.addEventListener('DOMContentLoaded', () => {
    const newThreadBtn = document.getElementById('new-thread-btn');
    const newThreadForm = document.getElementById('new-thread-form');
    const newTopicInput = document.getElementById('new-topic-input');
    const createThreadBtn = document.getElementById('create-thread-btn');
    const topicList = document.getElementById('topic-list');

    let topics = [];

    newThreadBtn.addEventListener('click', () => {
        newThreadForm.style.display = 'block';
    });

    createThreadBtn.addEventListener('click', async () => {
        const newTopic = newTopicInput.value.trim();
        if (newTopic) {
            try {
                const response = await fetch('/create-topic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: newTopic }),
                });
                const data = await response.json();
                if (data.success) {
                    topics.unshift({
                        id: data.id,
                        title: data.title,
                        created_at: data.date
                    });
                    renderTopics();
                    newTopicInput.value = '';
                    newThreadForm.style.display = 'none';
                } else {
                    console.error('Create topic failed:', data.message); // エラーメッセージをコンソールに出力
                    alert('トピックの作成に失敗しました');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('エラーが発生しました');
            }
        }
    });

    async function fetchTopics() {
        try {
            const response = await fetch('/topics');
            topics = await response.json();
            renderTopics();
        } catch (error) {
            console.error('Error fetching topics:', error);
            alert('トピックの取得に失敗しました');
        }
    }

    function renderTopics() {
        topicList.innerHTML = '';
        topics.forEach(topic => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${topic.title}</td>
                <td>${topic.created_at.replace(' ', 'T').replace('-', '/').replace('-', '/').replace('T', ' ').slice(0, 19)}</td>
                <td>
                    <a href="/debate.html?topic=${topic.id}" class="button">議論に参加</a>
                    <button class="button delete-btn" data-id="${topic.id}">削除</button>
                </td>
            `;
            topicList.appendChild(row);
    
            // 削除ボタンにイベントリスナーを追加
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const topicId = e.target.getAttribute('data-id');
                    deleteTopic(topicId);
                });
            });
        });
    }
    

    function deleteTopic(topicId) {
        // 削除機能の実装（サーバーサイドの実装が必要）
        if (confirm('このスレッドを削除してもよろしいですか？')) {
            // 削除のAPIコールをここに実装
            console.log('トピックを削除:', topicId);
            // 成功したら以下を実行
            topics = topics.filter(topic => topic.id !== parseInt(topicId));
            renderTopics();
        }
    }

    fetchTopics();
});
