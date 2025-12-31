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
            - img "Aiborg" [ref=e13]
            - paragraph [ref=e14]: Join the AI learning revolution
        - generic [ref=e15]:
            - generic [ref=e16]:
                - heading "Welcome" [level=3] [ref=e17]
                - paragraph [ref=e18]: Sign in to your account or create a new one
            - generic [ref=e20]:
                - tablist [ref=e21]:
                    - tab "Sign In" [selected] [ref=e22] [cursor=pointer]
                    - tab "Magic Link" [ref=e23] [cursor=pointer]
                    - tab "Sign Up" [ref=e24] [cursor=pointer]
                - alert [ref=e25]:
                    - generic [ref=e26]: Invalid login credentials
                - alert [ref=e27]:
                    - img [ref=e28]
                    - generic [ref=e32]:
                        "Note: You'll be securely redirected to our authentication provider for
                        sign-in."
                - tabpanel "Sign In" [ref=e33]:
                    - generic [ref=e34]:
                        - button "Continue with Google" [ref=e35] [cursor=pointer]:
                            - img
                            - text: Continue with Google
                        - button "Continue with GitHub" [ref=e36] [cursor=pointer]:
                            - img
                            - text: Continue with GitHub
                    - generic [ref=e40]: Or continue with email
                    - generic [ref=e41]:
                        - generic [ref=e42]:
                            - text: Email
                            - textbox "Email" [ref=e43]:
                                - /placeholder: Enter your email
                                - text: test.admin@example.com
                        - generic [ref=e44]:
                            - generic [ref=e45]:
                                - generic [ref=e46]: Password
                                - button "Forgot password?" [ref=e47] [cursor=pointer]
                            - textbox "Password" [ref=e48]:
                                - /placeholder: Enter your password
                                - text: TestAdmin123!
                        - button "Sign In" [ref=e49] [cursor=pointer]
```
