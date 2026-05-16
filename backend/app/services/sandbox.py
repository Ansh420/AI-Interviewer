import subprocess
import tempfile
import os
import asyncio

async def execute_code(language: str, code: str):
    """Executes code locally using subprocess."""
    
    if language == "python":
        return await run_local(["python", "-c", code])
    
    elif language == "javascript":
        return await run_local(["node", "-e", code])
    
    elif language == "cpp":
        # Requires g++ installed locally
        return await run_cpp_local(code)
    
    elif language == "java":
        # Requires javac installed locally
        return await run_java_local(code)
    
    else:
        return {"error": f"Language {language} is not supported for local execution yet."}

async def run_local(command):
    """Helper to run a command and capture output."""
    try:
        # Using asyncio.create_subprocess_exec for non-blocking execution
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=5.0)
            stdout_str = stdout.decode().strip()
            stderr_str = stderr.decode().strip()
            return {
                "stdout": stdout_str,
                "stderr": stderr_str,
                "output": stdout_str if stdout_str else stderr_str
            }
        except asyncio.TimeoutError:
            process.kill()
            return {"error": "Execution timed out (5s limit)"}
            
    except FileNotFoundError:
        return {"error": f"Interpreter not found. Please ensure {command[0]} is installed and in your PATH."}
    except Exception as e:
        return {"error": str(e)}

async def run_cpp_local(code):
    with tempfile.NamedTemporaryFile(suffix=".cpp", delete=False) as f:
        f.write(code.encode())
        tmp_cpp = f.name
    
    tmp_exe = tmp_cpp.replace(".cpp", ".exe" if os.name == 'nt' else "")
    
    try:
        # Compile
        compile_proc = await asyncio.create_subprocess_exec(
            "g++", tmp_cpp, "-o", tmp_exe,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        _, stderr = await compile_proc.communicate()
        
        if compile_proc.returncode != 0:
            return {"error": "Compilation Error", "output": stderr.decode()}
        
        # Run
        return await run_local([tmp_exe])
    finally:
        if os.path.exists(tmp_cpp): os.remove(tmp_cpp)
        if os.path.exists(tmp_exe): os.remove(tmp_exe)

async def run_java_local(code):
    # Java is tricky due to class name matching file name
    # We'll try a simple approach for now
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_java = os.path.join(tmpdir, "Main.java")
        with open(tmp_java, "w") as f:
            f.write(code)
        
        compile_proc = await asyncio.create_subprocess_exec(
            "javac", tmp_java,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        _, stderr = await compile_proc.communicate()
        
        if compile_proc.returncode != 0:
            return {"error": "Compilation Error", "output": stderr.decode()}
        
        return await run_local(["java", "-cp", tmpdir, "Main"])
