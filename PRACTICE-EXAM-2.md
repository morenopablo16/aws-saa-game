# AWS Solutions Architect Associate (SAA-C03) - Practice Exam 2

> **Instructions:** Read each question carefully. Click on the answer to reveal the correct solution and explanation.

---

## Question 16

A company hosts a data lake on AWS. The data lake consists of data in Amazon S3 and Amazon RDS for PostgreSQL. The company needs a reporting solution that provides data visualization and includes all the data sources within the data lake. Only the company's management team should have full access to all the visualizations. The rest of the company should have only limited access.

Which solution will meet these requirements?

- **A.** Use Amazon Athena to query the data and Amazon QuickSight to visualize the results.
- **B.** Create an analysis in Amazon QuickSight. Connect all the data sources and create new datasets. Publish dashboards to visualize the data. Share the dashboards with the appropriate users and groups.
- **C.** Use Amazon Redshift to consolidate the data and Tableau for visualization.
- **D.** Deploy a business intelligence application on EC2 instances.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon QuickSight is a business intelligence tool provided by AWS for data visualization and reporting. You can connect all data sources within the data lake, including Amazon S3 and Amazon RDS. You can create datasets within QuickSight and publish dashboards with appropriate access controls for different user groups.

</details>

---

## Question 17

A company is implementing a new business application. The application runs on two Amazon EC2 instances and uses an Amazon S3 bucket for document storage. A solutions architect needs to ensure that the EC2 instances can access the S3 bucket.

What should the solutions architect do to meet this requirement?

- **A.** Create an IAM role that grants access to the S3 bucket. Attach the role to the EC2 instances.
- **B.** Store AWS credentials on the EC2 instances.
- **C.** Configure S3 bucket policies to allow public access.
- **D.** Use AWS Security Token Service (STS) with long-term credentials.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

An IAM role allows you to delegate access to AWS resources and services. Create an IAM role that grants access to the S3 bucket and attach the role to the EC2 instances. This is the secure, AWS-recommended approach for granting permissions to applications running on EC2.

</details>

---

## Question 18

An application development team is designing a microservice that will convert large images to smaller, compressed images. When a user uploads an image through the web interface, the microservice should store the image in an Amazon S3 bucket, process and compress the image with an AWS Lambda function, and store the image in its compressed form in a different S3 bucket.

A solutions architect needs to design a solution that uses durable, stateless components to process the images automatically.

Which combination of actions will meet these requirements? (Choose two.)

- **A.** Create an Amazon Simple Queue Service (Amazon SQS) queue. Configure the S3 bucket to send a notification to the SQS queue when an image is uploaded to the S3 bucket.
- **B.** Configure the Lambda function to use the Amazon Simple Queue Service (Amazon SQS) queue as the invocation source. When the SQS message is successfully processed, delete the message in the queue.
- **C.** Use Amazon SNS to trigger the Lambda function directly from S3 events.
- **D.** Configure the Lambda function to poll the S3 bucket directly for new images.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answers: A, B**

Option A establishes a durable and scalable way to handle incoming image processing tasks using S3 event notifications to SQS.

Option B allows the Lambda function to retrieve messages from the queue and process them in a stateless manner. After successfully processing, the Lambda function deletes the message from the queue to avoid duplicate processing.

</details>

---

## Question 19

A company has a three-tier web application that is deployed on AWS. The web servers are deployed in a public subnet in a VPC. The application servers and database servers are deployed in private subnets in the same VPC. The company has deployed a third-party virtual firewall appliance from AWS Marketplace in an inspection VPC. The appliance is configured with an IP interface that can accept IP packets.

A solutions architect needs to integrate the web application with the appliance to inspect all traffic to the application before the traffic reaches the web server.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Deploy a Gateway Load Balancer in the inspection VPC. Create a Gateway Load Balancer endpoint to receive the incoming packets and forward the packets to the appliance.
- **B.** Use route tables to redirect traffic through the firewall appliance.
- **C.** Deploy the firewall appliance in the same VPC as the web servers.
- **D.** Use AWS Transit Gateway to route traffic through the inspection VPC.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

Gateway Load Balancer operates at layer 3 and is built on Hyperplane, capable of handling thousands of connections per second. Gateway Load Balancer endpoints are configured in spoke VPCs to perform inline inspection of traffic from multiple spoke VPCs in a simplified and scalable fashion while centralizing virtual appliances.

</details>

---

## Question 20

A company wants to improve its ability to clone large amounts of production data into a test environment in the same AWS Region. The data is stored in Amazon EC2 instances on Amazon Elastic Block Store (Amazon EBS) volumes. Modifications to the cloned data must not affect the production environment. The software that accesses this data requires consistently high I/O performance.

A solutions architect needs to minimize the time that is required to clone the production data into the test environment.

Which solution will meet these requirements?

- **A.** Use EBS volume copying to duplicate the volumes for the test environment.
- **B.** Take EBS snapshots of the production EBS volumes. Turn on the EBS fast snapshot restore feature on the EBS snapshots. Restore the snapshots into new EBS volumes. Attach the new EBS volumes to EC2 instances in the test environment.
- **C.** Use Amazon EFS to share the data between production and test environments.
- **D.** Use AWS Storage Gateway to copy data to the test environment.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon EBS fast snapshot restore (FSR) enables you to create a volume from a snapshot that is fully initialized at creation. This eliminates the latency of I/O operations on a block when it is accessed for the first time. Volumes created using fast snapshot restore instantly deliver all of their provisioned performance.

</details>

---

## Question 21

An ecommerce company wants to launch a one-deal-a-day website on AWS. Each day will feature exactly one product on sale for a period of 24 hours. The company wants to be able to handle millions of requests each hour with millisecond latency during peak hours.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Deploy the application on EC2 instances with Auto Scaling behind an ALB. Use Amazon RDS for the database.
- **B.** Use Amazon CloudFront with an on-premises origin server.
- **C.** Use Amazon S3 with static website hosting only.
- **D.** Use an Amazon S3 bucket to host the website's static content. Deploy an Amazon CloudFront distribution. Set the S3 bucket as the origin. Use Amazon API Gateway and AWS Lambda functions for the backend APIs. Store the data in Amazon DynamoDB.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: D**

Using Amazon S3 to host static content and Amazon CloudFront to distribute the content provides high performance and scale for millions of requests per hour. Amazon API Gateway and AWS Lambda build scalable, highly available backend APIs. Amazon DynamoDB provides the data layer. This solution uses fully managed services that automatically scale with minimal operational overhead.

</details>

---

## Question 22

A solutions architect is using Amazon S3 to design the storage architecture of a new digital media application. The media files must be resilient to the loss of an Availability Zone. Some files are accessed frequently while other files are rarely accessed in an unpredictable pattern. The solutions architect must minimize the costs of storing and retrieving the media files.

Which storage option meets these requirements?

- **A.** S3 Standard
- **B.** S3 Intelligent-Tiering
- **C.** S3 One Zone-Infrequent Access
- **D.** S3 Glacier Deep Archive

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon S3 Intelligent-Tiering automatically moves data to the most cost-effective storage tier based on access patterns. It stores objects in multiple Availability Zones for resilience. For files with unpredictable access patterns, it optimizes costs without operational overhead by automatically tiering between frequent and infrequent access tiers.

</details>

---

## Question 23

A company is storing backup files by using Amazon S3 Standard storage. The files are accessed frequently for 1 month. However, the files are not accessed after 1 month. The company must keep the files indefinitely.

Which storage solution will meet these requirements MOST cost-effectively?

- **A.** Use S3 Lifecycle configuration to transition objects from S3 Standard to S3 Glacier immediately.
- **B.** Create an S3 Lifecycle configuration to transition objects from S3 Standard to S3 Glacier Deep Archive after 1 month.
- **C.** Manually change the storage class of objects after 1 month.
- **D.** Use S3 Versioning to maintain multiple copies of the files.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon S3 Glacier Deep Archive is the lowest-cost storage option in Amazon S3 for long-term retention of data that is rarely accessed. An S3 Lifecycle configuration automatically transitions objects after 1 month, minimizing storage costs without manual intervention.

</details>

---

## Question 24

A company observes an increase in Amazon EC2 costs in its most recent bill. The billing team notices unwanted vertical scaling of instance types for a couple of EC2 instances. A solutions architect needs to create a graph comparing the last 2 months of EC2 costs and perform an in-depth analysis to identify the root cause of the vertical scaling.

How should the solutions architect generate the information with the LEAST operational overhead?

- **A.** Use AWS Budgets to analyze EC2 spending.
- **B.** Use Cost Explorer's granular filtering feature to perform an in-depth analysis of EC2 costs based on instance types.
- **C.** Export billing data to Amazon Redshift for analysis.
- **D.** Use CloudWatch metrics to track EC2 costs.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

AWS Cost Explorer provides built-in reporting and granular filtering capabilities. You can filter by instance type, usage type, and other dimensions to analyze EC2 costs over time. This provides the detailed analysis needed with minimal operational overhead.

</details>

---

## Question 25

A company is designing an application. The application uses an AWS Lambda function to receive information through Amazon API Gateway and to store the information in an Amazon Aurora PostgreSQL database.

During the proof-of-concept stage, the company has to increase the Lambda quotas significantly to handle the high volumes of data that the company needs to load into the database. A solutions architect must recommend a new design to improve scalability and minimize the configuration effort.

Which solution will meet these requirements?

- **A.** Increase the memory allocation of the Lambda function.
- **B.** Use Amazon Kinesis to buffer the data before processing.
- **C.** Use AWS Step Functions to orchestrate the Lambda functions.
- **D.** Set up two Lambda functions. Configure one function to receive the information. Configure the other function to load the information into the database. Integrate the Lambda functions by using an Amazon Simple Queue Service (Amazon SQS) queue.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: D**

By dividing functionality into two Lambda functions - one for receiving information and another for loading into the database - you can independently scale and optimize each function. Using SQS as a buffer between them decouples the components, allowing the database loader to process at its own pace while the receiver handles incoming API requests.

</details>

---

## Question 26

A company needs to review its AWS Cloud deployment to ensure that its Amazon S3 buckets do not have unauthorized configuration changes.

What should a solutions architect do to accomplish this goal?

- **A.** Turn on AWS Config with the appropriate rules.
- **B.** Use AWS CloudTrail to monitor S3 API calls.
- **C.** Enable S3 server access logging.
- **D.** Use AWS IAM Access Analyzer.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

AWS Config enables you to assess, audit, and evaluate the configurations of your AWS resources. You can use AWS Config to monitor and record changes to S3 bucket configurations. With appropriate managed rules (like s3-bucket-public-read-prohibited), you can detect and alert on unauthorized configuration changes.

</details>

---

## Question 27

A company is launching a new application and will display application metrics on an Amazon CloudWatch dashboard. The company's product manager needs to access this dashboard periodically. The product manager does not have an AWS account. A solutions architect must provide access to the product manager by following the principle of least privilege.

Which solution will meet these requirements?

- **A.** Share the dashboard from the CloudWatch console. Enter the product manager's email address, and complete the sharing steps. Provide a shareable link for the dashboard to the product manager.
- **B.** Create an IAM user for the product manager with read-only access to CloudWatch.
- **C.** Use AWS SSO to provide temporary access to the dashboard.
- **D.** Export the dashboard data to a public S3 bucket.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

CloudWatch Dashboard sharing allows you to share a single dashboard with specific email addresses. Each user creates their own password to view the dashboard. This provides read-only access to the specific dashboard without requiring an AWS account or broader IAM permissions, following the principle of least privilege.

</details>

---

## Question 28

A company is migrating applications to AWS. The applications are deployed in different accounts. The company manages the accounts centrally by using AWS Organizations. The company's security team needs a single sign-on (SSO) solution across all the company's accounts. The company must continue managing the users and groups in its on-premises self-managed Microsoft Active Directory.

Which solution will meet these requirements?

- **A.** Enable AWS Single Sign-On (AWS SSO) from the AWS SSO console. Create a one-way forest trust or a one-way domain trust to connect the company's self-managed Microsoft Active Directory with AWS SSO by using AWS Directory Service for Microsoft Active Directory.
- **B.** Use IAM users and groups in each AWS account.
- **C.** Deploy a custom identity provider on EC2 instances.
- **D.** Use AWS Directory Service with AD Connector only.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

AWS IAM Identity Center (successor to AWS SSO) with Active Directory integration allows you to use your existing corporate identities for AWS access. Creating a trust between your self-managed AD and AWS Directory Service enables centralized SSO across all AWS Organization accounts while maintaining on-premises identity management.

</details>

---

## Question 29

A company provides a Voice over Internet Protocol (VoIP) service that uses UDP connections. The service consists of Amazon EC2 instances that run in an Auto Scaling group. The company has deployments across multiple AWS Regions.

The company needs to route users to the Region with the lowest latency. The company also needs automated failover between Regions.

Which solution will meet these requirements?

- **A.** Deploy a Network Load Balancer (NLB) and an associated target group. Associate the target group with the Auto Scaling group. Use AWS Global Accelerator with the NLB as an endpoint in each Region.
- **B.** Use Application Load Balancers with cross-Region load balancing.
- **C.** Use Route 53 latency-based routing with health checks.
- **D.** Deploy EC2 instances in a single Region with larger instance types.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

AWS Global Accelerator uses the AWS global network to route traffic over optimized paths. It provides static IP addresses that act as fixed entry points to application endpoints in multiple Regions. Combined with Network Load Balancers (which support UDP), it provides low-latency routing and automatic failover across Regions.

</details>

---

## Question 30

A development team runs monthly resource-intensive tests on its general purpose Amazon RDS for MySQL DB instance with Performance Insights enabled. The testing lasts for 48 hours once a month and is the only process that uses the database. The team wants to reduce the cost of running the tests without reducing the compute and memory attributes of the DB instance.

Which solution meets these requirements MOST cost-effectively?

- **A.** Use Reserved Instances for the RDS instance.
- **B.** Run the database on EC2 instead of RDS.
- **C.** Create a snapshot when tests are completed. Terminate the DB instance and restore the snapshot when required.
- **D.** Use Aurora Serverless v2.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: C**

By creating a snapshot and terminating the DB instance, you stop incurring costs for the running instance during periods when tests are not running. When you need to run tests again, restore the snapshot to create a new instance. This approach provides the same compute and memory attributes while minimizing costs for infrequent usage.

</details>

---

**End of Practice Exam 2**

> **Tip:** Review any questions you got wrong and study the explanations before moving to the next exam.

---

**Navigation:**
- [Practice Exam 1](./PRACTICE-EXAM-1.md)
- [Practice Exam 3](./PRACTICE-EXAM-3.md)
