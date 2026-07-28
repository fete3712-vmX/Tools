global _start

# Code is messy, target = text to guess, len = LENGTH (REQUIRED) # I needed to test #
section .data
    target db "", 0
        len equ 4000
            buffer times 5 db 0
                newline db 10

                section .text
                _start:
                    mov rax, 123456789
                        mov rcx, 200000

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

                                                                                                .cmp:
                                                                                                    mov al, [rdi]
                                                                                                        cmp al, [rsi]
                                                                                                            jne .no_match
                                                                                                                inc rdi
                                                                                                                    inc rsi
                                                                                                                        dec rdx
                                                                                                                            jnz .cmp

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