
#!/bin/bash

# Check if Tectonic is installed
echo "Checking Tectonic installation..."
if command -v tectonic &> /dev/null; then
    echo "✅ Tectonic is installed:"
    tectonic --version
else
    echo "❌ Tectonic is NOT installed"
    exit 1
fi

# Check permissions on temp directories
echo "Checking temporary directory permissions..."
mkdir -p /tmp/latex-test
if [ $? -eq 0 ]; then
    echo "✅ Temp directory creation successful"
else
    echo "❌ Cannot create temp directories"
    exit 1
fi

# Simple LaTeX compilation test
echo "Testing LaTeX compilation..."
echo '\documentclass{article}\begin{document}Hello World\end{document}' > /tmp/latex-test/test.tex
tectonic --outdir /tmp/latex-test/output /tmp/latex-test/test.tex
if [ $? -eq 0 ]; then
    echo "✅ LaTeX compilation test successful"
else
    echo "❌ LaTeX compilation test failed"
    exit 1
fi

echo "All checks passed! Deployment verification successful."
