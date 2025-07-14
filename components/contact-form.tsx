"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2 } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"

interface ContactFormProps {
  dict: any
  lng: Locale
}

export function ContactForm({ dict, lng }: ContactFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: dict.contact.messageSent,
        description: dict.contact.messageSentDesc,
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
    } catch (error) {
      toast({
        title: dict.contact.messageError,
        description: dict.contact.messageErrorDesc,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{dict.contact.name}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={dict.contact.namePlaceholder}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{dict.contact.email}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder={dict.contact.emailPlaceholder}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{dict.contact.phone}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder={dict.contact.phonePlaceholder}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">{dict.contact.subject}</Label>
          <Select value={formData.subject} onValueChange={(value) => handleChange("subject", value)}>
            <SelectTrigger>
              <SelectValue placeholder={dict.contact.subjectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">{dict.contact.subjects.general}</SelectItem>
              <SelectItem value="buying">{dict.contact.subjects.buying}</SelectItem>
              <SelectItem value="selling">{dict.contact.subjects.selling}</SelectItem>
              <SelectItem value="renting">{dict.contact.subjects.renting}</SelectItem>
              <SelectItem value="support">{dict.contact.subjects.support}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{dict.contact.message}</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder={dict.contact.messagePlaceholder}
          rows={5}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {dict.contact.sending}
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {dict.contact.sendMessage}
          </>
        )}
      </Button>
    </form>
  )
}
