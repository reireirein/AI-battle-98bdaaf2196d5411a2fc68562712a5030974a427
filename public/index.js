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
                    alert('トピックの作成に失敗しました');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('エラーが発生しました');
            }
        }
    });

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
                <td>${topic.created_at}</td>
                <td>
                    <a href="/debate.html?topic=${topic.id}" class="button">議論に参加</a>
                    <button class="button delete-btn" data-id="${topic.id}">削除</button>
                </td>
            `;
            topicList.appendChild(row);
        });

        // 削除ボタンにイベントリスナーを追加
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.removeEventListener('click', handleDeleteClick); // 既存のリスナーを削除
            btn.addEventListener('click', handleDeleteClick); // 新しいリスナーを追加
        });
    }

    function handleDeleteClick(e) {
        const topicId = e.target.getAttribute('data-id');
        deleteTopic(topicId);
    }

    async function deleteTopic(topicId) {
        if (confirm('このスレッドを削除してもよろしいですか？')) {
            try {
                const response = await fetch(`/delete-topic/${topicId}`, {
                    method: 'DELETE',
                });
                const data = await response.json();
                if (data.success) {
                    // トピックを削除してリストを再描画
                    topics = topics.filter(topic => topic.id !== parseInt(topicId));
                    renderTopics();
                } else {
                    alert(data.message || 'トピックの削除に失敗しました');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('エラーが発生しました');
            }
        }
    }

    function renderTopics() {
        topicList.innerHTML = '';
        topics.forEach(topic => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${topic.title}</td>
                <td>${topic.created_at}</td>
                <td>
                    <a href="/debate.html?topic=${topic.id}" class="button">議論に参加</a>
                    <button class="button delete-btn" data-id="${topic.id}">削除</button>
                </td>
            `;
            topicList.appendChild(row);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.removeEventListener('click', handleDeleteClick);
            btn.addEventListener('click', handleDeleteClick);
        });
    }

    // Fetch and render topics on page load
    fetchTopics();
});