import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://qbumckppwmyxksskicws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidW1ja3Bwd215eGtzc2tpY3dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjQ1NjA1MiwiZXhwIjoyMDM4MDMyMDUyfQ.c3o4zW5W1D5-IyuJaJP5jDAOrMsSaHQuVCZaHKR6x_w';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const contentSection = document.getElementById('contentSection');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const logoutButton = document.getElementById('logoutButton');

    // Verifica se há um token de acesso na URL e redireciona para a página inicial
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (hashParams.has('access_token')) {
        window.location.href = 'http://127.0.0.1:5500/';
    } else if (hashParams.has('error')) {
        alert('Erro: ' + hashParams.get('error_description'));
        window.location.href = 'http://127.0.0.1:5500/';
    }

    logoutButton.addEventListener('click', async () => {
        await supabase.auth.signOut();
        contentSection.style.display = 'none';
        loginButton.style.display = 'inline-block';
        registerButton.style.display = 'inline-block';
        logoutButton.style.display = 'none';
    });

    // Registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            alert('Erro ao registrar: ' + error.message);
        } else {
            alert('Registro bem-sucedido! Por favor, verifique seu email para confirmar sua conta.');
            const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            modal.hide(); // Oculta o modal após o registro
        }
    });

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert('Erro ao fazer login: ' + error.message);
        } else {
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal.hide(); // Oculta o modal após o login
            contentSection.style.display = 'block';
            loginButton.style.display = 'none';
            registerButton.style.display = 'none';
            logoutButton.style.display = 'inline-block';
            updateDownloadList();
        }
    });

    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const fileButton = document.getElementById('fileButton');
    const fileDisplay = document.getElementById('fileDisplay');
    const removeFileButton = document.getElementById('removeFileButton');
    const downloadList = document.getElementById('downloadList');

    let selectedFile = null;

    fileButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        selectedFile = e.target.files[0];
        if (selectedFile) {
            fileDisplay.textContent = `Arquivo selecionado: ${selectedFile.name}`;
            fileButton.textContent = 'Trocar arquivo';
            removeFileButton.style.display = 'inline-block';
        } else {
            fileDisplay.textContent = '';
            fileButton.textContent = 'Escolha arquivo';
            removeFileButton.style.display = 'none';
        }
    });

    removeFileButton.addEventListener('click', () => {
        fileInput.value = '';
        fileDisplay.textContent = '';
        selectedFile = null;
        fileButton.textContent = 'Escolha arquivo';
        removeFileButton.style.display = 'none';
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            alert('Por favor, selecione um arquivo para enviar.');
            return;
        }

        const sanitizedFileName = selectedFile.name.replace(/[^a-z0-9\.\_\-]/gi, '_');

        try {
            console.log('Iniciando o upload do arquivo:', sanitizedFileName);
            const { data, error } = await supabase.storage
                .from('documents')
                .upload(sanitizedFileName, selectedFile);

            if (error) {
                throw error;
            }

            console.log('Arquivo enviado com sucesso:', data);

            alert('Arquivo enviado com sucesso!');
            fileInput.value = '';
            fileDisplay.textContent = '';
            fileButton.textContent = 'Escolha arquivo';
            selectedFile = null;
            removeFileButton.style.display = 'none';

            updateDownloadList();
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            
        }
    });

    async function updateDownloadList() {
        try {
            const { data, error } = await supabase.storage.from('documents').list();
            if (error) throw error;

            downloadList.innerHTML = '';

            for (const file of data) {
                const fileName = file.name;
                const { data: publicUrlData, error: urlError } = supabase.storage.from('documents').getPublicUrl(fileName);
                if (urlError) throw urlError;

                const publicURL = publicUrlData.publicUrl;

                console.log(`Arquivo: ${fileName}, URL pública: ${publicURL}`);

                if (!publicURL) {
                    console.error(`URL pública não está definida para o arquivo: ${fileName}`);
                    continue;
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

    updateDownloadList();
});
