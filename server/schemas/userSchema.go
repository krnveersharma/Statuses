package Schemas

type ClerkUser struct {
	ID    string `json:"id"`
	Email struct {
		Address string `json:"email_address"`
	} `json:"email_addresses"`
	Username       string `json:"username"`
	PublicMetadata struct {
		Role string `json:"role"`
	} `json:"public_metadata"`
}
