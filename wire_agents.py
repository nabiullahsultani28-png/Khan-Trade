import subprocess
import sys
import re
import argparse

def strip_ansi(text):
    # Regex to remove ANSI color codes
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)

def read_until_prompt(proc, prompt_patterns):
    buffer = ""
    clean_buffer = ""
    while True:
        char = proc.stdout.read(1)
        if not char:
            return buffer
        
        # Stream the output directly to our terminal so you can watch
        sys.stdout.write(char)
        sys.stdout.flush()
        
        buffer += char
        clean_buffer = strip_ansi(buffer)
        
        # Check if the current buffer ends with any of the expected prompts
        for prompt in prompt_patterns:
            if clean_buffer.endswith(prompt):
                # Return everything EXCEPT the prompt
                return clean_buffer[:-len(prompt)].strip()

def main():
    parser = argparse.ArgumentParser(description="Wire two terminal agents together.")
    parser.add_argument("--cmd1", type=str, required=True, help="Command for Agent A")
    parser.add_argument("--cmd2", type=str, required=True, help="Command for Agent B")
    parser.add_argument("--seed", type=str, default="Hello! Please introduce yourself and give me a fun fact to start our conversation.", help="Initial message to kickstart the chat")
    parser.add_argument("--prompts", type=str, nargs="+", 
                        default=["You: ", "You:", "> ", "User: ", "User:", "$ ", ">>> ", "claude> ", "agy> ", "? "], 
                        help="List of text prompts the agents use when waiting for input")
    args = parser.parse_args()

    prompts = args.prompts
    
    print(f"Starting Agent A: {args.cmd1}")
    agent_a = subprocess.Popen(
        args.cmd1, 
        stdin=subprocess.PIPE, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT, 
        text=True, 
        bufsize=1,
        shell=True,
        encoding='utf-8',
        errors='replace'
    )
    
    print(f"Starting Agent B: {args.cmd2}")
    agent_b = subprocess.Popen(
        args.cmd2, 
        stdin=subprocess.PIPE, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT, 
        text=True, 
        bufsize=1,
        shell=True,
        encoding='utf-8',
        errors='replace'
    )
    
    print(f"\n--- Waiting for both agents to initialize (listening for prompts: {prompts}) ---")
    # Read until their first input prompt appears
    read_until_prompt(agent_a, prompts)
    read_until_prompt(agent_b, prompts)
    
    print("\n\n--- Agents are ready. Starting conversation ---")
    
    message = args.seed
    
    print(f"\n[SYSTEM -> Agent A]: {message}\n")
    agent_a.stdin.write(message + "\n")
    agent_a.stdin.flush()
    
    turn = 'A'
    # Optional: regex to clean up prefixes so they don't echo "Agent: Agent: Hello" back and forth
    prefix_cleaner = re.compile(r"^(Agent|Bot|Assistant|System|Claude|Agy):\s*", re.IGNORECASE)
    
    try:
        while True:
            if turn == 'A':
                response = read_until_prompt(agent_a, prompts)
                clean_response = prefix_cleaner.sub("", response).strip()
                
                print(f"\n\n[Forwarding A -> B]\n")
                agent_b.stdin.write(clean_response + "\n")
                agent_b.stdin.flush()
                turn = 'B'
                
            else:
                response = read_until_prompt(agent_b, prompts)
                clean_response = prefix_cleaner.sub("", response).strip()
                
                print(f"\n\n[Forwarding B -> A]\n")
                agent_a.stdin.write(clean_response + "\n")
                agent_a.stdin.flush()
                turn = 'A'
                
    except KeyboardInterrupt:
        print("\nStopping conversation.")
        agent_a.terminate()
        agent_b.terminate()

if __name__ == "__main__":
    main()
