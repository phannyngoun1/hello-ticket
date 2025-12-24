# Form Field Components

Reusable form field components that integrate with `react-hook-form`. These components follow best practices for form inputs, including accessibility, validation, and error handling.

## Components

- **TextInputField** - Text, email, password, tel, url, and search inputs
- **NumberInputField** - Numeric inputs with min/max/step support
- **DateInputField** - Date picker inputs
- **DateTimeInputField** - Date and time picker inputs
- **TimeInputField** - Time picker inputs (HH:mm format)
- **DateRangeInputField** - Date range picker (start and end dates)
- **SelectInputField** - Dropdown/select inputs with searchable options
- **TextareaInputField** - Multi-line text input
- **CheckboxField** - Boolean checkbox input
- **SwitchField** - Toggle switch input
- **FileInputField** - File upload input
- **RadioGroupField** - Radio button group for single selection
- **SliderField** - Range slider for numeric values

## Usage

### Basic Example with FormProvider

```tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  TextInputField,
  NumberInputField,
  DateInputField,
  DateTimeInputField,
  TimeInputField,
  DateRangeInputField,
  SelectInputField,
  TextareaInputField,
  CheckboxField,
  SwitchField,
  FileInputField,
  RadioGroupField,
  SliderField,
} from "@truths/custom-ui";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  age: z.number().min(18, "Must be 18 or older"),
  birthDate: z.string().optional(),
  role: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

function MyForm() {
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      age: undefined,
      birthDate: undefined,
      role: undefined,
    },
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <TextInputField
          name="name"
          label="Name"
          placeholder="Enter your name"
          required
        />

        <TextInputField
          name="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          required
        />

        <NumberInputField
          name="age"
          label="Age"
          placeholder="Enter your age"
          min={18}
          max={100}
          required
        />

        <DateInputField
          name="birthDate"
          label="Birth Date"
          placeholder="Select birth date"
        />

        <SelectInputField
          name="role"
          label="Role"
          placeholder="Select a role"
          options={[
            { value: "admin", label: "Admin" },
            { value: "user", label: "User" },
            { value: "guest", label: "Guest" },
          ]}
          allowClear
        />

        <TextareaInputField
          name="description"
          label="Description"
          placeholder="Enter a description"
          rows={5}
        />

        <CheckboxField
          name="agreeToTerms"
          label="I agree to the terms and conditions"
          required
        />

        <SwitchField
          name="notifications"
          label="Enable notifications"
          description="Receive email notifications about updates"
        />

        <FileInputField
          name="avatar"
          label="Profile Picture"
          accept="image/*"
          helperText="Upload a profile picture (max 5MB)"
          maxSize={5 * 1024 * 1024}
        />

        <TimeInputField
          name="startTime"
          label="Start Time"
          helperText="Select the start time"
        />

        <DateRangeInputField
          startDateName="started_date"
          endDateName="ended_date"
          label="Event Period"
          helperText="Select the start and end dates for the event"
        />

        <RadioGroupField
          name="preference"
          label="Notification Preference"
          options={[
            {
              value: "email",
              label: "Email",
              description: "Receive notifications via email",
            },
            {
              value: "sms",
              label: "SMS",
              description: "Receive notifications via SMS",
            },
            {
              value: "push",
              label: "Push",
              description: "Receive push notifications",
            },
          ]}
        />

        <SliderField
          name="volume"
          label="Volume"
          min={0}
          max={100}
          step={1}
          formatValue={(value) => `${value}%`}
        />

        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

### Using with Direct Control Prop

If you prefer not to use `FormProvider`, you can pass the `control` prop directly:

```tsx
import { useForm } from "react-hook-form";
import { TextInputField, SelectInputField } from "@truths/custom-ui";

function MyForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: { name: "" },
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <TextInputField name="name" label="Name" control={control} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Component Props

### TextInputField

| Prop           | Type                                                            | Default      | Description                           |
| -------------- | --------------------------------------------------------------- | ------------ | ------------------------------------- |
| `name`         | `string`                                                        | **required** | Field name (must match form schema)   |
| `label`        | `string`                                                        | -            | Label text                            |
| `placeholder`  | `string`                                                        | -            | Placeholder text                      |
| `type`         | `"text" \| "email" \| "password" \| "tel" \| "url" \| "search"` | `"text"`     | Input type                            |
| `required`     | `boolean`                                                       | `false`      | Whether field is required             |
| `disabled`     | `boolean`                                                       | `false`      | Whether field is disabled             |
| `readOnly`     | `boolean`                                                       | `false`      | Whether field is read-only            |
| `helperText`   | `string`                                                        | -            | Helper text below input               |
| `autoComplete` | `string`                                                        | -            | Auto-complete attribute               |
| `maxLength`    | `number`                                                        | -            | Maximum input length                  |
| `minLength`    | `number`                                                        | -            | Minimum input length                  |
| `pattern`      | `string`                                                        | -            | Validation pattern                    |
| `className`    | `string`                                                        | -            | Additional CSS classes                |
| `errorMessage` | `string`                                                        | -            | Custom error message override         |
| `control`      | `Control`                                                       | -            | Optional control from react-hook-form |

### NumberInputField

| Prop            | Type              | Default      | Description                     |
| --------------- | ----------------- | ------------ | ------------------------------- |
| `name`          | `string`          | **required** | Field name                      |
| `label`         | `string`          | -            | Label text                      |
| `placeholder`   | `string`          | -            | Placeholder text                |
| `required`      | `boolean`         | `false`      | Whether field is required       |
| `disabled`      | `boolean`         | `false`      | Whether field is disabled       |
| `readOnly`      | `boolean`         | `false`      | Whether field is read-only      |
| `min`           | `number`          | -            | Minimum value                   |
| `max`           | `number`          | -            | Maximum value                   |
| `step`          | `number \| "any"` | -            | Step value                      |
| `allowDecimals` | `boolean`         | `true`       | Whether to allow decimal values |
| `helperText`    | `string`          | -            | Helper text                     |
| `className`     | `string`          | -            | Additional CSS classes          |
| `errorMessage`  | `string`          | -            | Custom error message            |
| `control`       | `Control`         | -            | Optional control                |

### DateInputField

| Prop           | Type      | Default      | Description                |
| -------------- | --------- | ------------ | -------------------------- |
| `name`         | `string`  | **required** | Field name                 |
| `label`        | `string`  | -            | Label text                 |
| `placeholder`  | `string`  | -            | Placeholder text           |
| `required`     | `boolean` | `false`      | Whether field is required  |
| `disabled`     | `boolean` | `false`      | Whether field is disabled  |
| `readOnly`     | `boolean` | `false`      | Whether field is read-only |
| `min`          | `string`  | -            | Minimum date (YYYY-MM-DD)  |
| `max`          | `string`  | -            | Maximum date (YYYY-MM-DD)  |
| `helperText`   | `string`  | -            | Helper text                |
| `className`    | `string`  | -            | Additional CSS classes     |
| `errorMessage` | `string`  | -            | Custom error message       |
| `control`      | `Control` | -            | Optional control           |

### DateTimeInputField

| Prop           | Type      | Default      | Description                         |
| -------------- | --------- | ------------ | ----------------------------------- |
| `name`         | `string`  | **required** | Field name                          |
| `label`        | `string`  | -            | Label text                          |
| `placeholder`  | `string`  | -            | Placeholder text                    |
| `required`     | `boolean` | `false`      | Whether field is required           |
| `disabled`     | `boolean` | `false`      | Whether field is disabled           |
| `readOnly`     | `boolean` | `false`      | Whether field is read-only          |
| `min`          | `string`  | -            | Minimum datetime (YYYY-MM-DDTHH:mm) |
| `max`          | `string`  | -            | Maximum datetime (YYYY-MM-DDTHH:mm) |
| `step`         | `number`  | `60`         | Step value in seconds               |
| `helperText`   | `string`  | -            | Helper text                         |
| `className`    | `string`  | -            | Additional CSS classes              |
| `errorMessage` | `string`  | -            | Custom error message                |
| `control`      | `Control` | -            | Optional control                    |

### SelectInputField

| Prop           | Type             | Default              | Description                         |
| -------------- | ---------------- | -------------------- | ----------------------------------- |
| `name`         | `string`         | **required**         | Field name                          |
| `label`        | `string`         | -                    | Label text                          |
| `placeholder`  | `string`         | `"Select an option"` | Placeholder text                    |
| `options`      | `SelectOption[]` | **required**         | Array of select options             |
| `required`     | `boolean`        | `false`              | Whether field is required           |
| `disabled`     | `boolean`        | `false`              | Whether field is disabled           |
| `allowClear`   | `boolean`        | `false`              | Whether to allow clearing selection |
| `clearLabel`   | `string`         | `"None"`             | Label for clear option              |
| `helperText`   | `string`         | -                    | Helper text                         |
| `className`    | `string`         | -                    | Additional CSS classes              |
| `errorMessage` | `string`         | -                    | Custom error message                |
| `control`      | `Control`        | -                    | Optional control                    |

### TextareaInputField

| Prop           | Type      | Default      | Description                |
| -------------- | --------- | ------------ | -------------------------- |
| `name`         | `string`  | **required** | Field name                 |
| `label`        | `string`  | -            | Label text                 |
| `placeholder`  | `string`  | -            | Placeholder text           |
| `required`     | `boolean` | `false`      | Whether field is required  |
| `disabled`     | `boolean` | `false`      | Whether field is disabled  |
| `readOnly`     | `boolean` | `false`      | Whether field is read-only |
| `rows`         | `number`  | `4`          | Number of rows (height)    |
| `maxLength`    | `number`  | -            | Maximum input length       |
| `minLength`    | `number`  | -            | Minimum input length       |
| `helperText`   | `string`  | -            | Helper text                |
| `className`    | `string`  | -            | Additional CSS classes     |
| `errorMessage` | `string`  | -            | Custom error message       |
| `control`      | `Control` | -            | Optional control           |

### CheckboxField

| Prop           | Type      | Default      | Description               |
| -------------- | --------- | ------------ | ------------------------- |
| `name`         | `string`  | **required** | Field name                |
| `label`        | `string`  | -            | Label text                |
| `required`     | `boolean` | `false`      | Whether field is required |
| `disabled`     | `boolean` | `false`      | Whether field is disabled |
| `helperText`   | `string`  | -            | Helper text               |
| `description`  | `string`  | -            | Description text          |
| `className`    | `string`  | -            | Additional CSS classes    |
| `errorMessage` | `string`  | -            | Custom error message      |
| `control`      | `Control` | -            | Optional control          |

### SwitchField

| Prop           | Type      | Default      | Description               |
| -------------- | --------- | ------------ | ------------------------- |
| `name`         | `string`  | **required** | Field name                |
| `label`        | `string`  | -            | Label text                |
| `required`     | `boolean` | `false`      | Whether field is required |
| `disabled`     | `boolean` | `false`      | Whether field is disabled |
| `helperText`   | `string`  | -            | Helper text               |
| `description`  | `string`  | -            | Description text          |
| `className`    | `string`  | -            | Additional CSS classes    |
| `errorMessage` | `string`  | -            | Custom error message      |
| `control`      | `Control` | -            | Optional control          |

### FileInputField

| Prop           | Type      | Default      | Description                            |
| -------------- | --------- | ------------ | -------------------------------------- |
| `name`         | `string`  | **required** | Field name                             |
| `label`        | `string`  | -            | Label text                             |
| `placeholder`  | `string`  | -            | Placeholder text                       |
| `required`     | `boolean` | `false`      | Whether field is required              |
| `disabled`     | `boolean` | `false`      | Whether field is disabled              |
| `accept`       | `string`  | -            | Accepted file types (e.g., "image/\*") |
| `multiple`     | `boolean` | `false`      | Whether to allow multiple files        |
| `maxSize`      | `number`  | -            | Maximum file size in bytes             |
| `buttonText`   | `string`  | `"Browse"`   | Custom button text                     |
| `helperText`   | `string`  | -            | Helper text                            |
| `className`    | `string`  | -            | Additional CSS classes                 |
| `errorMessage` | `string`  | -            | Custom error message                   |
| `control`      | `Control` | -            | Optional control                       |

### TimeInputField

| Prop           | Type      | Default      | Description                |
| -------------- | --------- | ------------ | -------------------------- |
| `name`         | `string`  | **required** | Field name                 |
| `label`        | `string`  | -            | Label text                 |
| `placeholder`  | `string`  | -            | Placeholder text           |
| `required`     | `boolean` | `false`      | Whether field is required  |
| `disabled`     | `boolean` | `false`      | Whether field is disabled  |
| `readOnly`     | `boolean` | `false`      | Whether field is read-only |
| `min`          | `string`  | -            | Minimum time (HH:mm)       |
| `max`          | `string`  | -            | Maximum time (HH:mm)       |
| `step`         | `number`  | `60`         | Step value in seconds      |
| `helperText`   | `string`  | -            | Helper text                |
| `className`    | `string`  | -            | Additional CSS classes     |
| `errorMessage` | `string`  | -            | Custom error message       |
| `control`      | `Control` | -            | Optional control           |

### DateRangeInputField

| Prop                    | Type      | Default        | Description                         |
| ----------------------- | --------- | -------------- | ----------------------------------- |
| `startDateName`         | `string`  | **required**   | Start date field name               |
| `endDateName`           | `string`  | **required**   | End date field name                 |
| `label`                 | `string`  | -              | Label text for the range            |
| `startDateLabel`        | `string`  | `"Start Date"` | Label for start date                |
| `endDateLabel`          | `string`  | `"End Date"`   | Label for end date                  |
| `required`              | `boolean` | `false`        | Whether field is required           |
| `disabled`              | `boolean` | `false`        | Whether field is disabled           |
| `readOnly`              | `boolean` | `false`        | Whether field is read-only          |
| `minDate`               | `string`  | -              | Minimum date (YYYY-MM-DD)           |
| `maxDate`               | `string`  | -              | Maximum date (YYYY-MM-DD)           |
| `helperText`            | `string`  | -              | Helper text                         |
| `className`             | `string`  | -              | Additional CSS classes              |
| `startDateErrorMessage` | `string`  | -              | Custom error message for start date |
| `endDateErrorMessage`   | `string`  | -              | Custom error message for end date   |
| `control`               | `Control` | -              | Optional control                    |

### RadioGroupField

| Prop           | Type                         | Default      | Description               |
| -------------- | ---------------------------- | ------------ | ------------------------- |
| `name`         | `string`                     | **required** | Field name                |
| `label`        | `string`                     | -            | Label text                |
| `options`      | `RadioOption[]`              | **required** | Array of radio options    |
| `required`     | `boolean`                    | `false`      | Whether field is required |
| `disabled`     | `boolean`                    | `false`      | Whether field is disabled |
| `orientation`  | `"vertical" \| "horizontal"` | `"vertical"` | Layout orientation        |
| `helperText`   | `string`                     | -            | Helper text               |
| `className`    | `string`                     | -            | Additional CSS classes    |
| `errorMessage` | `string`                     | -            | Custom error message      |
| `control`      | `Control`                    | -            | Optional control          |

### SliderField

| Prop           | Type                        | Default      | Description                   |
| -------------- | --------------------------- | ------------ | ----------------------------- |
| `name`         | `string`                    | **required** | Field name                    |
| `label`        | `string`                    | -            | Label text                    |
| `required`     | `boolean`                   | `false`      | Whether field is required     |
| `disabled`     | `boolean`                   | `false`      | Whether field is disabled     |
| `min`          | `number`                    | `0`          | Minimum value                 |
| `max`          | `number`                    | `100`        | Maximum value                 |
| `step`         | `number`                    | `1`          | Step value                    |
| `showValue`    | `boolean`                   | `true`       | Whether to show current value |
| `formatValue`  | `(value: number) => string` | -            | Custom value formatter        |
| `helperText`   | `string`                    | -            | Helper text                   |
| `className`    | `string`                    | -            | Additional CSS classes        |
| `errorMessage` | `string`                    | -            | Custom error message          |
| `control`      | `Control`                   | -            | Optional control              |

## Best Practices

1. **Use FormProvider**: For better type safety and cleaner code, wrap your form with `FormProvider`.

2. **Validation**: Use Zod (or another schema validator) with `zodResolver` for type-safe validation.

3. **Error Handling**: Components automatically display validation errors from react-hook-form. You can override with the `errorMessage` prop if needed.

4. **Accessibility**: All components include proper ARIA attributes and labels for screen readers.

5. **Consistent Styling**: Components use the design system's Field, FieldLabel, and FieldError components for consistent styling.

6. **Type Safety**: Components are fully typed with TypeScript and work with your form schema types.

## Notes

- All components use `Controller` from react-hook-form for proper integration
- Error messages are automatically extracted from form validation
- Components support both controlled and uncontrolled usage patterns
- All components are accessible and follow WCAG guidelines
