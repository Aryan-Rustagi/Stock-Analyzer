import { useState } from "react";

function SignUp() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    function handleNameChange(event) {
        setName(event.target.value);
    }

    function handleEmailChange(event) {
        setEmail(event.target.value);
    }

    function handlePasswordChange(event) {
        setPassword(event.target.value);
    }

    function handleConfirmPasswordChange(event) {
        setConfirmPassword(event.target.value);
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (name === "") {
            setError("Please enter your name");
            setMessage("");
        }
        else if (email === "") {
            setError("Please enter your email");
            setMessage("");
        }
        else if (password === "") {
            setError("Please enter your password");
            setMessage("");
        }
        else if (confirmPassword === "") {
            setError("Please confirm your password");
            setMessage("");
        }
        else if (password !== confirmPassword) {
            setError("Passwords do not match");
            setMessage("");
        }
        else {
            setError("");
            setMessage("Sign Up Successful!");

            console.log("Name:", name);
            console.log("Email:", email);
            console.log("Password:", password);

            // Optional: Clear the form after successful signup
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        }
    }

    return (
        <div>
            <h1>Sign Up</h1>

            <form onSubmit={handleSubmit}>

                <label>Name</label>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={handleNameChange}
                />

                <br />
                <br />

                <label>Email</label>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                />

                <br />
                <br />

                <label>Password</label>
                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                />

                <br />
                <br />

                <label>Confirm Password</label>
                <input
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                />

                <br />
                <br />

                <button type="submit">Sign Up</button>
            </form>

            <p>{error}</p>
            <p>{message}</p>
        </div>
    );
}

export default SignUp;