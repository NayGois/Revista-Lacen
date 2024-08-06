import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://qbumckppwmyxksskicws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidW1ja3Bwd215eGtzc2tpY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI0NTYwNTIsImV4cCI6MjAzODAzMjA1Mn0.pbuvB6XYT7zJKj-Iwn8hMYEenzhEUJqyno7ZUW0ewak';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const fileDisplay = document.getElementById('fileDisplay');
    const removeButton = document.getElementById('removeFileButton');

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            if (file.type === 'application/pdf') {
                fileDisplay.textContent = file.name;
                removeButton.style.display = 'inline-block';
            } else {
                alert('Por favor, selecione um arquivo PDF.');
                fileInput.value = '';
                fileDisplay.textContent = '';
                removeButton.style.display = 'none';
            }
        } else {
            fileDisplay.textContent = '';
            removeButton.style.display = 'none';
        }
    });

    removeButton.addEventListener('click', () => {
        fileInput.value = '';
        fileDisplay.textContent = '';
        removeButton.style.display = 'none';
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];

        if (!file) {
            alert('Por favor, selecione um arquivo para enviar.');
            return;
        }

        // Sanitize the file name
        const sanitizedFileName = file.name.replace(/[^a-z0-9\.\_\-]/gi, '_');

        try {
            console.log('Iniciando o upload do arquivo:', sanitizedFileName);
            const { data, error } = await supabase.storage
                .from('documents') // Nome do bucket
                .upload(sanitizedFileName, file);

            if (error) {
                throw error;
            }

            console.log('Arquivo enviado com sucesso:', data);

            alert('Arquivo enviado com sucesso!');
            
            // Limpar o input de arquivo e esconder nome e botão de remoção
            fileInput.value = '';
            fileDisplay.textContent = '';
            removeButton.style.display = 'none';

            updateDownloadList(); // Atualiza a lista de downloads
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            alert('Erro ao enviar arquivo.');
        }
    });

    async function updateDownloadList() {
        try {
            const { data, error } = await supabase.storage.from('documents').list();
            if (error) throw error;

            const downloadList = document.getElementById('downloadList');
            downloadList.innerHTML = ''; // Limpar lista existente

            for (const file of data) {
                const fileName = file.name; // Nome do arquivo
                const { data: publicUrlData, error: urlError } = supabase.storage.from('documents').getPublicUrl(fileName);
                if (urlError) throw urlError;

                const publicURL = publicUrlData.publicUrl;

                console.log(`File: ${fileName}, Public URL: ${publicURL}`); // Adicionando log para depuração

                if (!publicURL) {
                    console.error(`Public URL is not defined for file: ${fileName}`);
                    continue; // Pula para o próximo arquivo
                }

                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <a href="${publicURL}" download="${fileName}">
                        ${fileName}
                    </a>
                `;
                downloadList.appendChild(listItem);
            }
        } catch (error) {
            console.error('Erro ao listar arquivos:', error); 
        }
    }

    // Atualiza a lista de downloads na inicialização
    updateDownloadList();
});
