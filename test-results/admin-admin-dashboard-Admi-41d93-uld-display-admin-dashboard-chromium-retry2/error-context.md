# Page snapshot

```yaml
- generic [ref=e2]:
    - link "Skip to main content" [ref=e3] [cursor=pointer]:
        - /url: '#main-content'
    - region "Notifications (F8)":
        - list
    - generic [ref=e5]:
        - generic [ref=e6]:
            - link "Back to Home" [ref=e7] [cursor=pointer]:
                - /url: /
                - img [ref=e8]
                - text: Back to Home
            - img "Aiborg" [ref=e12]
            - paragraph [ref=e13]: Join the AI learning revolution
        - generic [ref=e14]:
            - generic [ref=e15]:
                - heading "Welcome" [level=3] [ref=e16]
                - paragraph [ref=e17]: Sign in to your account or create a new one
            - generic [ref=e19]:
                - tablist [ref=e20]:
                    - tab "Sign In" [selected] [ref=e21] [cursor=pointer]
                    - tab "Magic Link" [ref=e22] [cursor=pointer]
                    - tab "Sign Up" [ref=e23] [cursor=pointer]
                - alert [ref=e24]:
                    - img [ref=e25]
                    - generic [ref=e27]:
                        "Note: You'll be securely redirected to our authentication provider for
                        sign-in."
                - tabpanel "Sign In" [ref=e28]:
                    - generic [ref=e29]:
                        - button "Continue with Google" [ref=e30] [cursor=pointer]:
                            - img
                            - text: Continue with Google
                        - button "Continue with GitHub" [ref=e31] [cursor=pointer]:
                            - img
                            - text: Continue with GitHub
                    - generic [ref=e35]: Or continue with email
                    - generic [ref=e36]:
                        - generic [ref=e37]:
                            - text: Email
                            - textbox "Email" [ref=e38]:
                                - /placeholder: Enter your email
                        - generic [ref=e39]:
                            - generic [ref=e40]:
                                - generic [ref=e41]: Password
                                - button "Forgot password?" [ref=e42] [cursor=pointer]
                            - textbox "Password" [ref=e43]:
                                - /placeholder: Enter your password
                        - button "Sign In" [ref=e44] [cursor=pointer]
```
