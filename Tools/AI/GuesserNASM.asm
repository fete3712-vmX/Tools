global _start

; Change the text in target to the uppercase text you want to guess.
section .data
    target db 'HELLO'
    len equ $ - target
    buffer times len + 1 db 0
    newline db 10

section .text
_start:
    mov rbx, 123456789       ; PRNG state
    mov rcx, 200000          ; Number of candidate strings to try

.outer:
    mov rsi, buffer
    mov r8, len

.inner:
    mov rax, rbx
    imul rax, 1103515245
    add rax, 12345
    mov rbx, rax

    xor rdx, rdx
    mov r9, 26
    div r9
    add dl, 'A'
    mov [rsi], dl
    inc rsi
    dec r8
    jnz .inner

    mov byte [buffer + len], 0

    mov rdi, buffer
    mov rsi, target
    mov rdx, len

.compare:
    mov al, [rdi]
    cmp al, [rsi]
    jne .no_match
    inc rdi
    inc rsi
    dec rdx
    jnz .compare

    ; Candidate matched target: write it and a newline.
    mov rax, 1
    mov rdi, 1
    lea rsi, [rel buffer]
    mov rdx, len
    syscall

    mov rax, 1
    mov rdi, 1
    lea rsi, [rel newline]
    mov rdx, 1
    syscall
    jmp .exit

.no_match:
    dec rcx
    jnz .outer

    ; No candidate matched: write the target and a newline.
    mov rax, 1
    mov rdi, 1
    lea rsi, [rel target]
    mov rdx, len
    syscall

    mov rax, 1
    mov rdi, 1
    lea rsi, [rel newline]
    mov rdx, 1
    syscall

.exit:
    mov rax, 60
    xor rdi, rdi
    syscall
